import { useEffect, useState } from 'react';
import { PublicConfigService } from '../../hooks/publicConfig.service';
import { LiveSessionService } from '../../hooks/liveSession.service';
import { agoraService } from '../../hooks/agora.service';
import { LiveSessionType } from '../../utils/LiveSessionType';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PermissionsAndroid, Platform } from 'react-native';

type Props = {
  route: RouteProp<RootStackParamList, 'VideoCall'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'VideoCall'>;
};

export const useVideoCall = ({ navigation, route }: Props) => {
  // PARAM
  const bookingIdParam = route.params.bookingId;

  // STATE
  const [engine, setEngine] = useState<any>();
  const [liveSessionDetail, setLiveSessionDetail] = useState<LiveSessionType>();
  const [localUid, setLocalUid] = useState<number | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState<boolean>(true);
  const [cameraOn, setCameraOn] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstruct, setShowInstruct] = useState<boolean>(false);
  const [confirmMsg, setConfirmMsg] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // PERMISSION
  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      const cameraGranted =
        granted['android.permission.CAMERA'] ===
        PermissionsAndroid.RESULTS.GRANTED;

      const micGranted =
        granted['android.permission.RECORD_AUDIO'] ===
        PermissionsAndroid.RESULTS.GRANTED;

      console.log('📷 Camera permission:', cameraGranted);
      console.log('🎤 Mic permission:', micGranted);

      return cameraGranted && micGranted;
    } catch (err) {
      console.log('❌ Permission error:', err);
      return false;
    }
  };

  // API
  const init = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermissions();

      if (!granted) {
        setError('Ứng dụng cần quyền Camera và Microphone');
        return;
      }

      console.log('✅ Permissions granted');

      const resConfig = await PublicConfigService.getAgoraConfig();
      console.log('AGORA CONFIG:', resConfig);

      const resLiveSession =
        await LiveSessionService.getByBookingId(bookingIdParam);
      console.log('LIVE SESSION:', resLiveSession);

      setLiveSessionDetail(resLiveSession);

      const resSession = await LiveSessionService.getAgoraToken(
        resLiveSession.liveSessionId,
      );

      setLocalUid(resSession.uid);
      console.log('AGORA TOKEN:', resSession);

      const engineInstance = await agoraService.init(resConfig.appId);

      engineInstance.addListener(
        'onUserJoined',
        (connection, remoteUid, elapsed) => {
          console.log('👤 Remote user joined:', remoteUid);
          setRemoteUid(remoteUid);
        },
      );

      engineInstance.addListener(
        'onUserOffline',
        (connection, remoteUid, reason) => {
          console.log('❌ Remote user left:', remoteUid, 'reason:', reason);
          setRemoteUid(null);
        },
      );

      engineInstance.addListener(
        'onJoinChannelSuccess',
        (connection, elapsed) => {
          console.log('✅ Joined channel:', connection.channelId);
        },
      );

      await agoraService.joinChannel(
        resSession.token,
        resSession.channelName,
        resSession.uid,
      );
      console.log('📡 Joining channel:', resSession.channelName);
      console.log('UID:', resSession.uid);

      await LiveSessionService.markJoined(resLiveSession.liveSessionId);

      setEngine(engineInstance);
      setConnected(true);

      engineInstance.addListener('onLeaveChannel', () => {
        console.log('👋 Left channel');
      });

      engineInstance.addListener('onError', err => {
        console.log('🚨 Agora error:', err);
      });

      engineInstance.addListener(
        'onConnectionStateChanged',
        (state, reason) => {
          console.log('🌐 Connection state:', state, 'reason:', reason);
        },
      );
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const leave = async () => {
    setIsLoading(true);
    try {
      if (!liveSessionDetail) return null;

      await agoraService.leaveChannel();

      console.log('📡 Mark leave session');
      await LiveSessionService.markLeft(liveSessionDetail?.liveSessionId);
      setConnected(false);

      navigation.navigate('TraineeFeedback', {
        liveSessionId: liveSessionDetail?.liveSessionId,
        // liveSessionId: '5132a3f4-243a-44d0-b442-0ec618d4e838',
      });
    } catch (err: any) {
      if (err?.type === 'BUSINESS_ERROR') {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // HANDLERS
  const toggleCamera = () => {
    const next = !cameraOn;
    console.log('📷 Toggle camera:', next);

    agoraService.muteVideo(!next);
    setCameraOn(next);
  };

  const toggleMic = () => {
    const next = !micOn;
    console.log('🎤 Toggle mic:', next);

    agoraService.muteAudio(!next);
    setMicOn(next);
  };

  const flipCamera = () => {
    console.log('🔄 Flip camera');
    agoraService.switchCamera();
  };

  const onLeave = () => {
    openConfirmModal('Bạn có chắc muốn rời khỏi buổi tập?');
  };

  const openInstructModal = () => {
    setShowInstruct(true);
  };

  const closeInstructModal = () => {
    setShowInstruct(false);
  };

  const openConfirmModal = (msg: string) => {
    setConfirmMsg(msg);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setConfirmMsg('');
    setShowConfirmModal(false);
  };

  const onConfirmModal = () => {
    closeConfirmModal();
    leave();
  };

  // USE EFFECT
  useEffect(() => {
    init();

    return () => {
      console.log('🧹 Cleanup VideoCall');
      agoraService.leaveChannel();
    };
  }, [bookingIdParam]);

  return {
    engine,
    localUid,
    remoteUid,
    connected,
    onLeave,
    liveSessionDetail,
    isLoading,
    error,
    micOn,
    cameraOn,
    toggleCamera,
    toggleMic,
    openInstructModal,
    closeInstructModal,
    showInstruct,
    flipCamera,
    showConfirmModal,
    closeConfirmModal,
    onConfirmModal,
    confirmMsg,
  };
};
