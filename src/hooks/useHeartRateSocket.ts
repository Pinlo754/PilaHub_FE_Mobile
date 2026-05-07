import { useCallback, useEffect, useRef, useState } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

type HeartRatePayload = {
  liveSessionId: string;
  heartRate: number;
};

type PendingSubscription = {
  destination: string;
  cb: (payload: HeartRatePayload) => void;
};

type UseHeartRateSocket = {
  connect: (opts: {
    url: string;
    token?: string;
    useSockJS?: boolean;
  }) => void;

  disconnect: () => void;

  sendHeartRate: (payload: HeartRatePayload) => void;

  subscribeToCoach: (
    coachAccountId: string,
    cb: (payload: HeartRatePayload) => void
  ) => () => void;

  latestHeartRate: HeartRatePayload | null;

  isConnected: boolean;
};

export const useHeartRateSocket = (): UseHeartRateSocket => {
  const clientRef = useRef<Client | null>(null);

  const subsRef = useRef<Record<string, StompSubscription | null>>({});

  const pendingSubsRef = useRef<PendingSubscription[]>([]);

  const connectingRef = useRef(false);

  const [latestHeartRate, setLatestHeartRate] =
    useState<HeartRatePayload | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  /**
   * CONNECT
   */
  const connect = useCallback(
    ({
      url,
      token,
      useSockJS = false,
    }: {
      url: string;
      token?: string;
      useSockJS?: boolean;
    }) => {
      // already connected
      if (clientRef.current?.connected) {
        console.log('[HeartRateSocket] already connected');
        return;
      }

      // already connecting
      if (connectingRef.current) {
        console.log('[HeartRateSocket] already connecting');
        return;
      }

      console.log(
        '[HeartRateSocket] connecting to',
        url,
        'useSockJS=',
        useSockJS
      );

      connectingRef.current = true;

      const client = new Client({
        brokerURL: useSockJS ? undefined : url,

        reconnectDelay: 5000,

        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        debug: (msg: string) => {
          console.log('[STOMP DEBUG]', msg);
        },

        connectHeaders: token
          ? {
            Authorization: `Bearer ${token}`,
          }
          : {},

        onConnect: () => {
          console.log('[HeartRateSocket] ✅ CONNECTED');

          connectingRef.current = false;

          setIsConnected(true);

          /**
           * Drain pending subscriptions
           */
          if (pendingSubsRef.current.length > 0) {
            console.log(
              '[HeartRateSocket] draining pending subscriptions:',
              pendingSubsRef.current.length
            );

            const pending = [...pendingSubsRef.current];

            pendingSubsRef.current = [];

            pending.forEach((item) => {
              try {
                const sub = client.subscribe(
                  item.destination,
                  (message: IMessage) => {
                    try {
                      console.log(
                        '[HeartRateSocket] ✅ MESSAGE RECEIVED (pending)'
                      );

                      const payload = JSON.parse(
                        message.body
                      ) as HeartRatePayload;

                      setLatestHeartRate(payload);

                      item.cb(payload);
                    } catch (e) {
                      console.warn(
                        '[HeartRateSocket] invalid pending message',
                        e
                      );
                    }
                  }
                );

                subsRef.current[item.destination] = sub;

                console.log(
                  '[HeartRateSocket] ✅ pending subscription restored:',
                  item.destination
                );
              } catch (e) {
                console.error(
                  '[HeartRateSocket] failed pending subscription',
                  e
                );
              }
            });
          }
        },

        onDisconnect: () => {
          console.log('[HeartRateSocket] 🔌 DISCONNECTED');

          setIsConnected(false);
        },

        onStompError: (frame) => {
          console.error('[HeartRateSocket] ❌ STOMP ERROR', frame);
        },

        onWebSocketClose: () => {
          console.log('[HeartRateSocket] websocket closed');

          connectingRef.current = false;

          setIsConnected(false);
        },

        onWebSocketError: (ev) => {
          console.error('[HeartRateSocket] ❌ websocket error', ev);
        },
      });

      /**
       * SOCKJS
       */
      if (useSockJS) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const SockJS = require('sockjs-client');

        client.webSocketFactory = () => new SockJS(url);

        console.log('[HeartRateSocket] using SockJS');
      }

      clientRef.current = client;

      client.activate();
    },
    []
  );

  /**
   * DISCONNECT
   */
  const disconnect = useCallback(() => {
    console.log('[HeartRateSocket] disconnecting');

    // unsubscribe all
    Object.values(subsRef.current).forEach((sub) => {
      try {
        sub?.unsubscribe();
      } catch (e) {
        console.warn('[HeartRateSocket] unsubscribe error', e);
      }
    });

    subsRef.current = {};

    pendingSubsRef.current = [];

    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch (e) {
        console.warn('[HeartRateSocket] deactivate error', e);
      }
    }

    clientRef.current = null;

    connectingRef.current = false;

    setIsConnected(false);

    console.log('[HeartRateSocket] ✅ disconnected completely');
  }, []);

  /**
   * SEND HEART RATE
   */
  const sendHeartRate = useCallback((payload: HeartRatePayload) => {
    const client = clientRef.current;

    if (!client || !client.connected) {
      console.warn(
        '[HeartRateSocket] cannot send, not connected',
        payload
      );
      return;
    }

    try {
      console.log('[HeartRateSocket] publishing heart rate', payload);

      client.publish({
        destination: '/app/heartrate/send',
        body: JSON.stringify(payload),
        skipContentLengthHeader: true,
      });

      console.log('[HeartRateSocket] ✅ publish success');
    } catch (e) {
      console.error('[HeartRateSocket] ❌ publish failed', e);
    }
  }, []);

  /**
   * SUBSCRIBE COACH
   */
  const subscribeToCoach = useCallback(
    (
      coachAccountId: string,
      cb: (payload: HeartRatePayload) => void
    ) => {
      const client = clientRef.current;

      const destination = `/queue/heartrate/${coachAccountId.replace(/^"|"$/g, '')}`;

      console.log(
        '[HeartRateSocket] subscribeToCoach called',
        {
          coachAccountId,
          connected: client?.connected,
          active: client?.active,
        }
      );

      /**
       * not connected yet
       */
      if (!client || !client.connected) {
        console.log(
          '[HeartRateSocket] queue subscription until connected:',
          destination
        );

        pendingSubsRef.current.push({
          destination,
          cb,
        });

        return () => {
          pendingSubsRef.current = pendingSubsRef.current.filter(
            (p) => !(p.destination === destination && p.cb === cb)
          );
        };
      }

      /**
       * subscribe immediately
       */
      try {
        console.log(
          '[HeartRateSocket] subscribing to',
          destination
        );

        const sub = client.subscribe(
          destination,
          (message: IMessage) => {
            try {
              console.log(
                '[HeartRateSocket] ✅ MESSAGE RECEIVED'
              );

              console.log(
                '[HeartRateSocket] raw:',
                message.body
              );

              const payload = JSON.parse(
                message.body
              ) as HeartRatePayload;

              console.log(
                '[HeartRateSocket] parsed payload:',
                payload
              );

              setLatestHeartRate(payload);

              cb(payload);

              console.log(
                '[HeartRateSocket] ✅ callback executed'
              );
            } catch (e) {
              console.error(
                '[HeartRateSocket] ❌ message parse error',
                e
              );
            }
          }
        );

        subsRef.current[destination] = sub;

        console.log(
          '[HeartRateSocket] ✅ SUBSCRIBED SUCCESS'
        );
      } catch (e) {
        console.error(
          '[HeartRateSocket] ❌ FAILED TO SUBSCRIBE',
          e
        );
      }

      /**
       * unsubscribe
       */
      return () => {
        try {
          console.log(
            '[HeartRateSocket] unsubscribing from',
            destination
          );

          subsRef.current[destination]?.unsubscribe();

          subsRef.current[destination] = null;

          console.log(
            '[HeartRateSocket] ✅ unsubscribed'
          );
        } catch (e) {
          console.warn(
            '[HeartRateSocket] unsubscribe failed',
            e
          );
        }
      };
    },
    []
  );

  /**
   * AUTO CLEANUP
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendHeartRate,
    subscribeToCoach,
    latestHeartRate,
    isConnected,
  };
};

export default useHeartRateSocket;