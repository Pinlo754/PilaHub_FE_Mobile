import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';

type Props = {
  visible: boolean;
  message?: string;
  type?: 'success' | 'error' | 'info';
  onHidden?: () => void;
};

export default function Toast({ visible, message = '', type = 'info', onHidden }: Props) {
  const translateY = React.useRef(new Animated.Value(40)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 40, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => onHidden && onHidden());
    }
  }, [visible]);

  if (!visible) return null;

  const bgClass = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-gray-800';

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 40,
        zIndex: 9999,
      }}
    >
      <View className={`${bgClass} rounded-lg px-4 py-3` as any}>
        <Text className="text-white text-center">{message}</Text>
      </View>
    </Animated.View>
  );
}
