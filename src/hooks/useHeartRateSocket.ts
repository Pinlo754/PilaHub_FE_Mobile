import { useCallback, useEffect, useRef, useState } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
// If your backend uses SockJS (Spring SockJS endpoint) uncomment below and install sockjs-client
// import SockJS from 'sockjs-client';

type HeartRatePayload = {
  liveSessionId: string;
  heartRate: number;
};

type UseHeartRateSocket = {
  connect: (opts: { url: string; token?: string; useSockJS?: boolean }) => void;
  disconnect: () => void;
  sendHeartRate: (payload: HeartRatePayload) => void;
  subscribeToCoach: (coachAccountId: string, cb: (payload: HeartRatePayload) => void) => () => void;
  latestHeartRate: HeartRatePayload | null;
  isConnected: boolean;
};

export const useHeartRateSocket = (): UseHeartRateSocket => {
  const clientRef = useRef<Client | null>(null);
  const connectingRef = useRef<boolean>(false);
  const subsRef = useRef<Record<string, StompSubscription | null>>({});
  const pendingSubsRef = useRef<Array<{ destination: string; cb: (payload: HeartRatePayload) => void }>>([]);
  const [latestHeartRate, setLatestHeartRate] = useState<HeartRatePayload | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(({ url, token, useSockJS = false }: { url: string; token?: string; useSockJS?: boolean }) => {
    // Prevent concurrent activation attempts
    if (clientRef.current && clientRef.current.active) return;
    if (connectingRef.current) return;

    console.log('[HeartRateSocket] connecting to', url, 'useSockJS=', useSockJS);

    const client = new Client({
      // If using SockJS, we will set webSocketFactory below
      brokerURL: useSockJS ? undefined : url,
      // Heartbeat to avoid server-side timeouts and detect dead sockets
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 5000,
      debug: (msg: string) => console.log('[STOMP DEBUG]', msg),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.log('[HeartRateSocket] connected');
        connectingRef.current = false;
        setIsConnected(true);
        // Drain any pending subscriptions requested before connection
        // Use setTimeout to ensure client is fully ready before subscribing
        const drainPending = () => {
          console.log('[HeartRateSocket] draining pending subscriptions, count:', pendingSubsRef.current.length);
          try {
            const pending = pendingSubsRef.current.splice(0, pendingSubsRef.current.length);
            if (pending.length === 0) {
              console.log('[HeartRateSocket] no pending subscriptions to drain');
              return;
            }
            pending.forEach((p, idx) => {
              try {
                console.log(`[HeartRateSocket] draining pending sub ${idx + 1}/${pending.length}: ${p.destination}`);
                const sub = client.subscribe(p.destination, (message: IMessage) => {
                  try {
                    console.log('[HeartRateSocket] message received raw (pending):', message.body);
                    const payload = JSON.parse(message.body) as HeartRatePayload;
                    setLatestHeartRate(payload);
                    p.cb(payload);
                  } catch (e) {
                    console.warn('[HeartRateSocket] invalid pending message', e);
                  }
                });
                // store subscription by destination
                const key = p.destination;
                subsRef.current[key] = sub;
                console.log(`[HeartRateSocket] ✅ subscription drained: ${p.destination}`);
              } catch (e) {
                console.warn(`[HeartRateSocket] failed to drain pending sub ${idx}:`, e);
              }
            });
          } catch (e) {
            console.warn('[HeartRateSocket] error draining pending subs', e);
          }
        };
        // Defer draining to ensure client is fully ready
        setTimeout(drainPending, 200);
      },
      onStompError: (frame) => {
        console.warn('[STOMP] broker error', frame);
      },
      onWebSocketClose: () => {
        console.log('[HeartRateSocket] websocket closed');
        connectingRef.current = false;
        setIsConnected(false);
      },
      onWebSocketError: (ev) => {
        console.warn('[STOMP] websocket error', ev);
      },
    });

    // Optional: use SockJS transport when backend endpoint uses SockJS (Spring)
    if (useSockJS) {
      // @ts-ignore - sockjs-client type may differ; ensure you have it installed
      const SockJS = require('sockjs-client');
      client.webSocketFactory = () => new SockJS(url);
      console.log('[HeartRateSocket] using SockJS transport');
    }

    console.log('[HeartRateSocket] activating STOMP client');
    connectingRef.current = true;
    client.activate();
    clientRef.current = client;

  }, []);

  const disconnect = useCallback(() => {
    // 1. Hủy tất cả các subscription đang active
    Object.values(subsRef.current).forEach((s) => s && s.unsubscribe());
    subsRef.current = {};

    // 2. XÓA SẠCH hàng đợi pending (để đảm bảo trạng thái hoàn toàn mới khi mount lại)
    pendingSubsRef.current = [];

    // 3. Ngắt kết nối socket
    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch (e) {
        console.log('[HeartRateSocket] error during disconnect', e);
      }
      clientRef.current = null;
      connectingRef.current = false;
    }

    setIsConnected(false);
    console.log('[HeartRateSocket] disconnected and cleaned up completely');
  }, []);

  useEffect(() => {
    return () => {
      disconnect(); // Tự động chạy khi rời trang
    };
  }, [disconnect]);

  const sendHeartRate = useCallback((payload: HeartRatePayload) => {
    const client = clientRef.current;
    if (!client || !client.active) {
      console.warn('[HeartRateSocket] cannot send, client not connected', payload);
      return;
    }

    console.log('[HeartRateSocket] publishing heart rate', payload);
    client.publish({
      destination: '/app/heartrate/send',
      body: JSON.stringify(payload),
      skipContentLengthHeader: true,
    });
  }, []);

  const subscribeToCoach = useCallback((coachAccountId: string, cb: (payload: HeartRatePayload) => void) => {
    const client = clientRef.current;
    const endId = coachAccountId ? coachAccountId.replace(/^"|"$/g, '') : null;
    // Use user-specific destination that Spring maps to the coach's session
    const destination = `/queue/heartrate/${endId}`;

    console.log('[HeartRateSocket] subscribeToCoach called, client:', client ? 'exists' : 'null', 'active:', client?.active ?? 'N/A');

    // If client not yet created or not active, queue subscription until connected
    if (!client || !client.active) {
      console.log('[HeartRateSocket] queuing subscribe until connected for', destination);
      pendingSubsRef.current.push({ destination, cb });
      console.log('[HeartRateSocket] pending queue now has', pendingSubsRef.current.length, 'items');
      // return unsubscribe that removes pending
      return () => {
        pendingSubsRef.current = pendingSubsRef.current.filter(p => p.destination !== destination || p.cb !== cb);
      };
    }

    // Queue subscription to ensure STOMP is fully ready
    console.log('[HeartRateSocket] will subscribe after delay to ensure STOMP is ready');
    const timeoutId = setTimeout(() => {
      try {
        console.log('[HeartRateSocket] attempting subscription now to', destination, 'for coach:', coachAccountId);
        const sub = client.subscribe(destination, (message: IMessage) => {
          try {
            console.log('[HeartRateSocket] ✅ MESSAGE RECEIVED on', destination);
            console.log('[HeartRateSocket] raw message body:', message.body);
            console.log('[HeartRateSocket] message headers:', message.headers);
            const payload = JSON.parse(message.body) as HeartRatePayload;
            console.log('[HeartRateSocket] ✅ PARSED PAYLOAD:', payload);
            setLatestHeartRate(payload);
            console.log('[HeartRateSocket] ✅ STATE UPDATED, about to call callback');
            cb(payload);
            console.log('[HeartRateSocket] ✅ CALLBACK EXECUTED');
          } catch (e) {
            console.warn('[HeartRateSocket] ❌ ERROR processing message:', e);
            console.warn('[HeartRateSocket] raw message:', message.body);
          }
        });

        // store subscription keyed by destination
        const key = destination;
        subsRef.current[key] = sub;
        console.log('[HeartRateSocket] ✅ SUBSCRIPTION OBJECT STORED:', key, 'subscription exists:', subsRef.current[key] !== null);
      } catch (e) {
        console.error('[HeartRateSocket] ❌ FAILED to subscribe:', e);
      }
    }, 300); // wait 300ms to ensure STOMP is fully ready

    return () => {
      clearTimeout(timeoutId);
      try {
        console.log('[HeartRateSocket] unsubscribing from', destination);
        const sub = subsRef.current[destination];
        if (sub) {
          sub.unsubscribe();
        }
      } catch (e) {
        console.warn('[HeartRateSocket] error unsubscribing', e);
      }
      subsRef.current[destination] = null;
    };
  }, []);

  // auto-clean on unmount
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
