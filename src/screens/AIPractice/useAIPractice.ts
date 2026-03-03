import { RouteProp } from '@react-navigation/native';
import { useState } from 'react';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = {
  route: RouteProp<RootStackParamList, 'AIPractice'>;
};

export const useAIPractice = ({ route }: Props) => {
  // CONSTANTS
  const TIMEOUT = 3000;

  // PARAM
  const { exercise_id, imgUrl, videoUrl, workoutSessionId } = route.params;

  // STATE
  const [isVideoVisible, setIsVideoVisible] = useState<boolean>(false);
  const [isVideoPlay, setIsVideoPlay] = useState<boolean>(false);
  const [showNoti, setShowNoti] = useState<{
    visible: boolean;
    msg: string;
  }>({
    visible: false,
    msg: '',
  });
  const [showInstruct, setShowInstruct] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    visible: boolean;
    msg: string;
  }>({
    visible: false,
    msg: '',
  });

  // HANDLERS
  const togglePlayButton = () => {
    setIsVideoPlay(prev => !prev);
  };

  const openInstructModal = () => {
    setShowInstruct(true);
  };

  const closeInstructModal = () => {
    setShowInstruct(false);
  };

  const openConfirmModal = (msg: string) => {
    setShowConfirmModal({ visible: true, msg });
  };

  const closeConfirmModal = () => {
    setShowConfirmModal({ visible: false, msg: '' });
  };

  const openNoti = (msg: string) => {
    setShowNoti({ visible: true, msg });
  };

  const closeNoti = () => {
    setTimeout(() => {
      setShowNoti({ visible: false, msg: '' });
    }, TIMEOUT);
  };

  return {
    isVideoVisible,
    setIsVideoVisible,
    isVideoPlay,
    togglePlayButton,
    showNoti,
    showInstruct,
    openInstructModal,
    closeInstructModal,
    showConfirmModal,
    openConfirmModal,
    closeConfirmModal,
    openNoti,
    closeNoti,
    imgUrl,
    videoUrl,
    workoutSessionId,
  };
};
