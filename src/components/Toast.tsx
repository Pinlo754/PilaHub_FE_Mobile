import React, { useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Pressable } from 'react-native';

type Props = {
  visible: boolean;
  message?: string;
  type?: 'success' | 'error' | 'info';
  onHidden?: () => void;
  duration?: number; // ms to auto-hide, default 3000; if 0 or undefined, auto-hide
};

export default function Toast({ visible, message = '', type = 'info', onHidden, duration = 3000 }: Props) {
  const translateY = React.useRef(new Animated.Value(-40)).current; // start above
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -40, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => onHidden && onHidden());
    }
    // include refs and callback in deps to satisfy react-hooks/exhaustive-deps
  }, [visible, onHidden, opacity, translateY]);

  // auto-hide timer
  useEffect(() => {
    if (!visible) return;
    if (!duration || duration <= 0) return; // no auto-hide
    const id = setTimeout(() => {
      try { if (onHidden) onHidden(); } catch { /* ignore */ }
    }, duration);
    return () => clearTimeout(id);
  }, [visible, duration, onHidden]);

  if (!visible) return null;

  const bgClass = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-gray-800';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <Pressable onPress={() => onHidden && onHidden()} android_ripple={{color: '#00000010'}}>
        <View className={`${bgClass} rounded-lg px-4 py-3`}> 
          <Text className="text-white text-center">{message}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 48,
    zIndex: 9999,
    alignItems: 'center',
  },
});
