import { ActivityIndicator, Text, View } from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCall'>;

const VideoCall = (props: Props) => {
  // HOOK
  const {
    cameraOn,
    error,
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
  } = useVideoCall({ navigation: props.navigation, route: props.route });
  return (
    <>
      {isLoading && <LoadingOverlay />}

      <View className="flex-1 pt-14 bg-background">
        {/* Header */}
        <Header openInstructModal={openInstructModal} />

        {/* Remote video */}
        {remoteUid ? (
          <RtcSurfaceView
            canvas={{ uid: remoteUid, renderMode: 1 }}
            style={{
              flex: 1,
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.foreground} />
            <Text className="mt-4 color-foreground font-medium text-lg">
              Đang chờ HLV tham gia...
            </Text>
          </View>
        )}

        {/* Local video */}
        <View
          style={{
            position: 'absolute',
            width: 120,
            height: 180,
            top: 145,
            right: 10,
            borderRadius: 10,
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          <RtcSurfaceView
            canvas={{ uid: 0, renderMode: 1 }}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </View>

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
      </View>
    </>
  );
};

export default VideoCall;
