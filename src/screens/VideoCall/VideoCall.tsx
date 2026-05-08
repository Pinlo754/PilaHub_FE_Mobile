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
import TraineeHeartRateDisplay from './components/TraineeHeartRateDisplay';
import HeartRateBackgroundWorker from './components/HeartRateBackgroundWorker';
import CoachHeartRateMonitor from './components/CoachHeartRateWorker';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCall'>;

const VideoCall = (props: Props) => {
  // --- AGORA & CALL LOGIC ---
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

  // --- HEART RATE SOCKET LOGIC ---
  const [role, setRole] = React.useState<string | null>(null);
  const {
    connect: hrConnect,
    disconnect: hrDisconnect,
    subscribeToCoach,
    sendHeartRate,
    latestHeartRate,
    isConnected: hrIsConnected,
  } = useHeartRateSocket();

  // Khởi tạo kết nối Socket một lần duy nhất khi vào màn hình
  React.useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;

    (async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const storedRole = await AsyncStorage.getItem('role');
        const id = (await AsyncStorage.getItem('accountId')) || (await AsyncStorage.getItem('id'));

        if (!mounted) return;
        setRole(storedRole);

        // Connect STOMP
        const wsUrl = `https://api.pilahub.io.vn/ws/heartrate`;
        hrConnect({ url: wsUrl, token: token ?? undefined, useSockJS: true });

        // Nếu là Coach, thực hiện đăng ký nhận tin (nhưng không lưu state ở đây để tránh re-render cha)
        if (storedRole === 'COACH' && id) {
          unsub = subscribeToCoach(id, () => {
            // Logic nhận tin đã được CoachHeartRateMonitor xử lý ngầm qua hook chung
            console.log('[VideoCall] Coach subscribed to stream');
          });
        }
      } catch (e) {
        console.error('[VideoCall] HR Setup Error:', e);
      }
    })();

    return () => {
      mounted = false;
      if (unsub) unsub();
      hrDisconnect();
    };
  }, []); // Chỉ chạy khi mount/unmount

  // --- VIEWS ---

  const CoachView = () => (
    <>
      {/* Video chính - Agora sẽ không bị re-render nếu ta memo đúng CoachHeartRateMonitor */}
      {remoteUid ? (
        <RtcSurfaceView canvas={{ uid: remoteUid, renderMode: 1 }} style={styles.remoteSurface} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.foreground} />
          <Text className="mt-4 color-foreground font-medium text-lg">Đang chờ học viên...</Text>
        </View>
      )}

      {/* TRUYỀN HR QUA PROPS TẠI ĐÂY */}
      <CoachHeartRateMonitor
        bpm={latestHeartRate?.heartRate}
        hrIsConnected={hrIsConnected}
      />

      <View style={styles.localVideoContainer}>
        <RtcSurfaceView canvas={{ uid: 0, renderMode: 1 }} style={styles.localVideoSurface} />
      </View>
    </>
  );

  const TraineeView = () => (
    <>
      {/* Remote Video của HLV */}
      {remoteUid ? (
        <RtcSurfaceView canvas={{ uid: remoteUid, renderMode: 1 }} style={styles.remoteSurface} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.foreground} />
          <Text className="mt-4 color-foreground font-medium text-lg">Đang chờ HLV...</Text>
        </View>
      )}

      <View style={styles.localVideoContainer}>
        <RtcSurfaceView canvas={{ uid: 0, renderMode: 1 }} style={styles.localVideoSurface} />

        {/* TÁCH BIỆT: Chỉ hiển thị nhịp tim local của Trainee */}
        <TraineeHeartRateDisplay />
      </View>
    </>
  );

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <View className="flex-1 pt-14 bg-background">
        <Header openInstructModal={openInstructModal} />

        {/* DEBUG INFO */}
        {(props.route.params as any)?.debug && (
          <View style={styles.debugBanner}>
            <Text style={styles.debugText}>Channel: {debugInfo?.channelName ?? liveSessionDetail?.channelName ?? 'n/a'}</Text>
            <Text style={styles.debugText}>UID: {String(debugInfo?.uid ?? liveSessionDetail?.traineeUid ?? '')}</Text>
          </View>
        )}

        {/* ROLE BASED RENDERING */}
        {role === 'COACH' ? <CoachView /> : <TraineeView />}

        <Control
          cameraOn={cameraOn}
          leaveCall={onLeave}
          micOn={micOn}
          toggleCamera={toggleCamera}
          toggleMic={toggleMic}
          flipCamera={flipCamera}
        />

        {/* WORKER NGẦM: Tự động lấy HR từ BLE và gửi lên Socket mà không re-render màn hình chính */}
        {role === 'TRAINEE' && (
          <HeartRateBackgroundWorker
            liveId={liveSessionDetail?.liveSessionId}
            hrIsConnected={hrIsConnected}
            sendHeartRate={sendHeartRate}
          />
        )}

        {/* MODALS */}
        {showInstruct && (
          <View className="absolute inset-0 bg-black/40">
            <InstructModal visible={showInstruct} onClose={closeInstructModal} />
          </View>
        )}

        <ModalPopup
          visible={showConfirmModal}
          mode="confirm"
          contentText={confirmMsg}
          iconName="alert"
          confirmBtnText="Xác nhận"
          onConfirm={onConfirmModal}
          onClose={closeConfirmModal}
          modalWidth={355}
        />

        <ModalPopup
          visible={showErrorModal}
          mode="noti"
          contentText={errorMsg || ''}
          iconName="alert"
          confirmBtnText="Đóng"
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
  debugBanner: {
    position: 'absolute',
    top: 44,
    left: 12,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 6,
  },
  debugText: { color: '#fff', fontSize: 12 },
});