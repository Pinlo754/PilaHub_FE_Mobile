import React from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  message?: string;
};

const LoadingOverlay = ({ message }: Props) => {
  return (
    <Modal transparent animationType="none" visible={true} statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/40">
        <View className="items-center rounded-2xl bg-background px-8 py-6">
          <ActivityIndicator size="large" color={colors.foreground} />
          {message && (
            <Text className="mt-2 text-base font-semibold text-foreground text-center">
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default LoadingOverlay;
