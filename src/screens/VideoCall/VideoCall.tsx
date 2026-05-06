import {
  ActivityIndicator,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import Header from './components/Header';
import Control from './components/Control';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useVideoCall } from './useVideoCall';
import InstructModal from './components/InstructModal';
import LoadingOverlay from '../../components/LoadingOverlay';
import { RtcSurfaceView } from 'react-native-agora';
import { colors } from '../../theme/colors';
import ModalPopup from '../../components/ModalPopup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { useHeartRateSocket } from '../../hooks/useHeartRateSocket';
import PolarHeartRate from '../../components/PolarHeartRate';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCall'>;

const VideoCall = (props: Props) => {
  // HOOK
  const {
    cameraOn,
    isLoading,
    onLeave,
    liveSessionDetail,
    micOn,
    remoteUid,
    toggleCamera,
    toggleMic,
    closeInstructModal,
    openInstructModal,
    showInstruct,
    flipCamera,
    closeConfirmModal,
    onConfirmModal,
    showConfirmModal,
    confirmMsg,
    debugInfo,
    closeErrorModal,
    errorMsg,
    showErrorModal,
  } = useVideoCall({
    navigation: props.navigation,
    route: props.route,
  });

  // HEART RATE INTEGRATION
  const [role, setRole] = React.useState<string | null>(null);
  // trainee visible bpm for manual send
  const [traineeBpm, setTraineeBpm] = React.useState<number | null>(null);
  const [lastSentAt, setLastSentAt] = React.useState<number | null>(null);

  // simple throttle without external deps
  const bleThrottleRef = React.useRef<{ last: number }>({ last: 0 });

  const {
    connect: hrConnect,
    disconnect: hrDisconnect,
    sendHeartRate,
    subscribeToCoach,
    latestHeartRate,
    isConnected: hrIsConnected,
  } = useHeartRateSocket();

  const [hrSubscribed, setHrSubscribed] = React.useState<boolean>(false);
  const [coachHeartRate, setCoachHeartRate] = React.useState<number | null>(
    null,
  );

  // Watch for heart rate updates from STOMP subscription
  React.useEffect(() => {
    if (latestHeartRate?.heartRate) {
      console.log(
        '[VideoCall] ❤️ UPDATING UI with heart rate:',
        latestHeartRate.heartRate,
      );
      console.log(
        '[VideoCall] ❤️ latestHeartRate full object:',
        latestHeartRate,
      );
      console.log(
        '[VideoCall] ❤️ Setting coachHeartRate state to:',
        latestHeartRate.heartRate,
      );
      setCoachHeartRate(latestHeartRate.heartRate);
      console.log('[VideoCall] ❤️ coachHeartRate state updated');
    } else {
      console.log(
        '[VideoCall] ⚠️ latestHeartRate is null or empty:',
        latestHeartRate,
      );
    }
  }, [latestHeartRate]);

  React.useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;
    (async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const storedRole = await AsyncStorage.getItem('role');
        const id =
          (await AsyncStorage.getItem('accountId')) ||
          (await AsyncStorage.getItem('id')) ||
          null;
        if (!mounted) return;
        setRole(storedRole);

        // derive backend base from axios instance if available
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const api = require('../../hooks/axiosInstance').default;
        const endId = id ? id.replace(/^"|"$/g, '') : null;
        const base = api?.defaults?.baseURL
          ? String(api.defaults.baseURL).replace(/\/api\/?$/, '')
          : 'http://pilahub.io.vn';
        const wsUrl = `http://pilahub.io.vn/ws/heartrate`;

        hrConnect({ url: wsUrl, token: token ?? undefined, useSockJS: true });

        if (storedRole === 'COACH' && id) {
          // subscribe to server queue for this coach
          console.log(
            '[VideoCall] COACH subscribing to heart rate, coachId:',
            id,
          );
          unsub = subscribeToCoach(id, (payload: any) => {
            // latestHeartRate state updated by hook; set subscribed true on first message
            try {
              console.log(
                '[VideoCall] 🎯 COACH RECEIVED HEART RATE PAYLOAD:',
                payload,
              );
              setHrSubscribed(true);
            } catch (e) {
              console.warn('[VideoCall] Error in HR callback:', e);
            }
          });
          // mark subscribed immediately if we got an unsubscribe function (subscription queued or active)
          if (typeof unsub === 'function') setHrSubscribed(true);
          console.log(
            '[VideoCall] COACH subscription setup complete, unsub function exists:',
            typeof unsub === 'function',
          );
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      mounted = false;
      try {
        if (unsub) unsub();
      } catch {}
      try {
        hrDisconnect();
      } catch {}
    };
  }, [liveSessionDetail, hrConnect, hrDisconnect, subscribeToCoach]);

  // auto-send heart rate from BLE (trainee) with simple throttle
  const handleBleHr = React.useCallback(
    (bpm: number) => {
      console.log('[VideoCall] BLE heart rate received:', bpm);

      if (!bpm || role === 'COACH') return;

      // Vẫn cập nhật UI cho Trainee thấy bpm hiện tại
      setTraineeBpm(bpm);

      const now = Date.now();
      if (now - bleThrottleRef.current.last < 1000) return; // 1s throttle
      bleThrottleRef.current.last = now;

      // Kiểm tra xem đã có liveSessionId chưa
      const liveId = liveSessionDetail?.liveSessionId ?? '';
      if (!liveId) {
        console.warn('[VideoCall] Bỏ qua gửi HR: Chưa có liveSessionId');
        return;
      }

      // Kiểm tra xem WebSocket đã sẵn sàng chưa
      if (!hrIsConnected) {
        console.warn('[VideoCall] Bỏ qua gửi HR: WebSocket chưa kết nối');
        return;
      }

      try {
        console.log(`[VideoCall] Đang gửi HR: ${bpm} cho session: ${liveId}`);
        sendHeartRate({ liveSessionId: liveId, heartRate: bpm });
        setLastSentAt(Date.now());
      } catch (error) {
        console.error(
          '[VideoCall] Bị lỗi trong quá trình sendHeartRate:',
          error,
        );
      }
    },
    [role, liveSessionDetail, sendHeartRate, hrIsConnected], // <-- Đừng quên thêm hrIsConnected
  );

  // Separate views for clarity
  const CoachView = () => (
    <>
      {/* Remote video */}
      {remoteUid ? (
        <RtcSurfaceView
          canvas={{ uid: remoteUid, renderMode: 1 }}
          style={styles.remoteSurface}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.foreground} />
          <Text className="mt-4 color-foreground font-medium text-lg">
            Đang chờ học viên tham gia...
          </Text>
        </View>
      )}

      {/* Heart rate overlay for coach */}
      <View style={styles.hrOverlay}>
        <View style={styles.hrCard}>
          <Text style={styles.hrLabel}>HR</Text>
          <Text style={styles.hrValue}>{coachHeartRate ?? '--'} bpm</Text>
          <Text
            style={{ color: '#fff', fontSize: 11, marginTop: 4 }}
          >{`STOMP: ${hrIsConnected ? 'connected' : 'disconnected'} • subscribed: ${hrSubscribed ? 'yes' : 'no'}`}</Text>
        </View>
      </View>

      {/* Local video small */}
      <View style={styles.localVideoContainer}>
        <RtcSurfaceView
          canvas={{ uid: 0, renderMode: 1 }}
          style={styles.localVideoSurface}
        />
      </View>
    </>
  );

  const TraineeView = () => (
    <>
      {/* Remote video */}
      {remoteUid ? (
        <RtcSurfaceView
          canvas={{ uid: remoteUid, renderMode: 1 }}
          style={styles.remoteSurface}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.foreground} />
          <Text className="mt-4 color-foreground font-medium text-lg">
            Đang chờ HLV tham gia...
          </Text>
        </View>
      )}

      {/* Local video + BLE */}
      <View style={styles.localVideoContainer}>
        <RtcSurfaceView
          canvas={{ uid: 0, renderMode: 1 }}
          style={styles.localVideoSurface}
        />

        <View style={styles.bleContainer}>
          <PolarHeartRate
            compact
            autoStart
            onHeartRate={bpm => handleBleHr(bpm)}
          />
          <View style={{ marginTop: 8, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 14 }}>
              {traineeBpm ? `${traineeBpm} bpm` : 'No HR'}
            </Text>
            <Text style={{ color: '#fff', fontSize: 12, marginTop: 6 }}>
              {lastSentAt
                ? `Sent ${new Date(lastSentAt).toLocaleTimeString()}`
                : 'Not sent yet'}
            </Text>
            <Text style={{ color: '#fff', fontSize: 11, marginTop: 6 }}>
              Auto-send enabled
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <View className="flex-1 pt-14 bg-background">
        {/* Header */}
        <Header openInstructModal={openInstructModal} />

        {/* DEBUG BANNER */}
        {(props.route.params as any)?.debug && (
          <View
            style={{ position: 'absolute', top: 44, left: 12, zIndex: 999 }}
          >
            <View
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: 8,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12 }}>
                channel:{' '}
                {debugInfo?.channelName ??
                  liveSessionDetail?.channelName ??
                  'n/a'}
              </Text>
              <Text style={{ color: '#fff', fontSize: 12 }}>
                uid:{' '}
                {String(debugInfo?.uid ?? liveSessionDetail?.traineeUid ?? '')}
              </Text>
              <Text style={{ color: '#fff', fontSize: 10 }} numberOfLines={1}>
                token:{' '}
                {debugInfo?.token
                  ? 'yes'
                  : liveSessionDetail?.traineeToken
                    ? 'yes'
                    : 'no'}
              </Text>
            </View>
          </View>
        )}

        {/* Role-based main area */}
        {role === 'COACH' ? <CoachView /> : <TraineeView />}

        {/* Control */}
        <Control
          cameraOn={cameraOn}
          leaveCall={onLeave}
          micOn={micOn}
          toggleCamera={toggleCamera}
          toggleMic={toggleMic}
          flipCamera={flipCamera}
        />

        {/* Instruct Modal */}
        {showInstruct && (
          <View className="absolute inset-0 bg-black/40">
            <InstructModal
              visible={showInstruct}
              onClose={closeInstructModal}
            />
          </View>
        )}

        {/* Confirm Modal */}
        <ModalPopup
          visible={showConfirmModal}
          mode="confirm"
          contentText={confirmMsg}
          iconName="alert"
          iconSize={35}
          iconBgColor="yellow"
          confirmBtnText="Xác nhận"
          confirmBtnColor="green"
          cancelBtnText="Đóng"
          cancelBtnColor="grey"
          onConfirm={onConfirmModal}
          onClose={closeConfirmModal}
          modalWidth={355}
        />

        {/* Error Modal */}
        <ModalPopup
          visible={showErrorModal}
          mode="noti"
          contentText={errorMsg || ''}
          iconName="alert"
          iconSize={35}
          iconBgColor="red"
          confirmBtnText="Đóng"
          confirmBtnColor="grey"
          onClose={closeErrorModal}
          modalWidth={355}
        />
      </View>
    </>
  );
};

export default VideoCall;

const styles = StyleSheet.create({
  remoteSurface: { flex: 1 },
  hrOverlay: { position: 'absolute', top: 100, left: 12, zIndex: 50 },
  hrCard: { backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 8 },
  hrLabel: { color: '#fff', fontWeight: '700', fontSize: 18 },
  hrValue: { color: '#fff', fontSize: 20 },
  localVideoContainer: {
    position: 'absolute',
    width: 120,
    height: 180,
    top: 145,
    right: 10,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 10,
  },
  localVideoSurface: { width: '100%', height: '100%' },
  bleContainer: { position: 'absolute', left: 8, bottom: 8 },
});
