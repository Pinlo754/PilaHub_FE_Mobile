import React from 'react';
import { ActivityIndicator, Modal, View } from 'react-native';
import { colors } from '../theme/colors';

const LoadingOverlay = () => {
  return (
    <Modal transparent animationType="none" visible={true} statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/40">
        <ActivityIndicator size="large" color={colors.background.DEFAULT} />
      </View>
    </Modal>
  );
};

export default LoadingOverlay;
