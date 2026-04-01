import { useEffect, useState, useCallback, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { IRtcEngine, RtcStats, UserOfflineReasonType } from 'react-native-agora';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { PublicConfigService } from '../../hooks/publicConfig.service';
import { LiveSessionService } from '../../hooks/liveSession.service';
import { agoraService } from '../../hooks/agora.service';
import { LiveSessionType } from '../../utils/LiveSessionType';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = {
  route: RouteProp<RootStackParamList, 'VideoCall'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'VideoCall'>;
};

export const useVideoCall = ({ navigation, route }: Props) => {
  const bookingIdParam = route.params.bookingId;

  // Refs để truy cập giá trị mới nhất trong callback nếu cần
  const engineRef = useRef<IRtcEngine | null>(null);

  // STATE
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [liveSessionDetail, setLiveSessionDetail] = useState<LiveSessionType>();
  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState<boolean>(true);
  const [cameraOn, setCameraOn] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [showInstruct, setShowInstruct] = useState<boolean>(false);
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      return (
        granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  const initAgora = useCallback(async () => {
    setIsLoading(true);
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setError('Ứng dụng cần quyền Camera và Microphone để tiếp tục.');
        return;
      }

      // 1. Lấy Config & Session Data
      const [resConfig, resLiveSession] = await Promise.all([
        PublicConfigService.getAgoraConfig(),
        LiveSessionService.getByBookingId(bookingIdParam)
      ]);
      
      setLiveSessionDetail(resLiveSession);

      const resSession = await LiveSessionService.getAgoraToken(resLiveSession.liveSessionId);

      // 2. Khởi tạo Engine
      const engineInstance = await agoraService.init(resConfig.appId);
      engineRef.current = engineInstance;

      // 3. Đăng ký Event Handler (Quan trọng để nhận Remote UID)
      engineInstance.registerEventHandler({
        onJoinChannelSuccess: (connection) => {
          console.log('✅ Local joined:', connection.localUid);
          setConnected(true);
        },
        onUserJoined: (connection, uid) => {
          console.log('👤 Remote user joined:', uid);
          setRemoteUid(uid);
        },
        onUserOffline: (connection, uid, reason) => {
          console.log('❌ Remote user left:', uid, reason);
          setRemoteUid(null);
        },
        onError: (err, msg) => {
          console.error('🚨 Agora Error:', err, msg);
        },
        onLeaveChannel: () => {
          setConnected(false);
          setRemoteUid(null);
        }
      });

      // 4. Join Channel
      await agoraService.joinChannel(
        resSession.token,
        resSession.channelName,
        resSession.uid
      );

      // 5. Đánh dấu đã tham gia phía server
      await LiveSessionService.markJoined(resLiveSession.liveSessionId);

    } catch (err: any) {
      console.error('Init Error:', err);
      setError(err?.message || 'Không thể kết nối cuộc gọi video.');
    } finally {
      setIsLoading(false);
    }
  }, [bookingIdParam]);

  const leave = async () => {
    try {
      setIsLoading(true);
      if (liveSessionDetail) {
        await LiveSessionService.markLeft(liveSessionDetail.liveSessionId);
      }
      await agoraService.leaveChannel();
      navigation.navigate('TraineeFeedback', {
        liveSessionId: liveSessionDetail?.liveSessionId,
      });
    } catch (err) {
      console.error('Leave error:', err);
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // Toggles
  const toggleCamera = () => {
    const next = !cameraOn;
    agoraService.muteVideo(!next);
    setCameraOn(next);
  };

  const toggleMic = () => {
    const next = !micOn;
    agoraService.muteAudio(!next);
    setMicOn(next);
  };

  const flipCamera = () => agoraService.switchCamera();

  // Modal Handlers
  const onLeave = () => {
    setConfirmMsg('Bạn có chắc muốn rời khỏi buổi tập?');
    setShowConfirmModal(true);
  };

  useEffect(() => {
    initAgora();
    return () => {
      console.log('🧹 Cleaning up Agora...');
      agoraService.leaveChannel();
      // Xóa tất cả listeners khi unmount
      engineRef.current?.unregisterEventHandler({});
    };
  }, [initAgora]);

  return {
    remoteUid,
    connected,
    liveSessionDetail,
    isLoading,
    error,
    micOn,
    cameraOn,
    showInstruct,
    showConfirmModal,
    confirmMsg,
    toggleCamera,
    toggleMic,
    flipCamera,
    onLeave,
    openInstructModal: () => setShowInstruct(true),
    closeInstructModal: () => setShowInstruct(false),
    closeConfirmModal: () => setShowConfirmModal(false),
    onConfirmModal: () => {
      setShowConfirmModal(false);
      leave();
    },
  };
};