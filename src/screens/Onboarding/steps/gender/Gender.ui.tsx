import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useGenderLogic } from './Gender.logic';

export default function GenderUI() {
  const { gender, onSelectGender, canContinue, onNext, onBack } = useGenderLogic();

  // Animated values for male and female
  const maleRipple = useRef(new Animated.Value(0)).current; // 0..1
  const maleIconScale = useRef(new Animated.Value(1)).current;
  const maleDrop = useRef(new Animated.Value(0)).current; // 0..1 drop progress
  const femaleRipple = useRef(new Animated.Value(0)).current;
  const femaleIconScale = useRef(new Animated.Value(1)).current;
  const femaleDrop = useRef(new Animated.Value(0)).current;

  const playSelectAnimation = (which: 'male' | 'female') => {
    const ripple = which === 'male' ? maleRipple : femaleRipple;
    const iconScale = which === 'male' ? maleIconScale : femaleIconScale;
    const otherRipple = which === 'male' ? femaleRipple : maleRipple;
    const drop = which === 'male' ? maleDrop : femaleDrop;
    const otherDrop = which === 'male' ? femaleDrop : maleDrop;

    // reset other's ripple/drop
    otherRipple.setValue(0);
    otherDrop.setValue(0);

    ripple.setValue(0);
    iconScale.setValue(0.95);
    drop.setValue(0);

    // play drop animation first, then ripple + icon bounce
    Animated.sequence([
      Animated.timing(drop, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(ripple, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(iconScale, { toValue: 1.12, duration: 180, useNativeDriver: true }),
          Animated.timing(iconScale, { toValue: 1.0, duration: 160, useNativeDriver: true }),
        ]),
      ]),
    ]).start(() => {
      // reset drop after small delay so ripple can finish
      setTimeout(() => drop.setValue(0), 300);
    });
  };

  const onPressMale = () => {
    onSelectGender('male');
    playSelectAnimation('male');
  };
  const onPressFemale = () => {
    onSelectGender('female');
    playSelectAnimation('female');
  };

  // helper interpolations
  const maleRippleStyle = {
    transform: [
      {
        scale: maleRipple.interpolate({ inputRange: [0, 1], outputRange: [0.2, 3.6] }),
      },
    ],
    opacity: maleRipple.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 0.25, 0] }),
  } as any;

  const femaleRippleStyle = {
    transform: [
      {
        scale: femaleRipple.interpolate({ inputRange: [0, 1], outputRange: [0.2, 3.6] }),
      },
    ],
    opacity: femaleRipple.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 0.25, 0] }),
  } as any;

  return (
    <View className="flex-1 bg-background ">
      {/* Header */}
      <Pressable onPress={onBack} className="mb-6">
        <Text className="text-secondaryText text-base">← Quay lại</Text>
      </Pressable>

      {/* Title */}
      <Text className="text-xl font-semibold text-foreground text-center">Giới Tính Của Bạn?</Text>

      <Text className="text-sm text-secondaryText text-center mt-2 px-6">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
        sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </Text>

      {/* Gender options */}
      <View className="flex-1 justify-center space-y-8">
        {/* Male */}
        <Pressable onPress={onPressMale} className="items-center" android_ripple={{ color: '#00000010', radius: 40 }}>
          <View
            className={`w-40 h-40 rounded-full items-center justify-center
              ${gender === 'male' ? 'bg-warning' : 'bg-background-sub2'}`}
          >
            {/* falling drop */}
            <Animated.View
              pointerEvents="none"
              className={gender === 'male' ? 'absolute -top-6 w-3 h-6 bg-orange-600 rounded-full' : 'absolute -top-6 w-3 h-6 bg-yellow-200 rounded-full'}
              style={{
                transform: [
                  { translateY: maleDrop.interpolate({ inputRange: [0, 1], outputRange: [-18, 6] }) },
                  { scale: maleDrop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                  { rotate: '-20deg' },
                ],
                opacity: maleDrop.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 0] }),
              }}
            />

            <Animated.View
              pointerEvents="none"
              className={
                gender === 'male'
                  ? 'absolute w-40 h-40 rounded-full bg-white/20'
                  : 'absolute w-40 h-40 rounded-full bg-yellow-200/10'
              }
              style={[maleRippleStyle]}
            />

            <Animated.View style={{ transform: [{ scale: maleIconScale }] }}>
              <Ionicons name="male" size={56} color={gender === 'male' ? '#fff' : '#F2B94C'} />
            </Animated.View>
          </View>
          <Text className="mt-3 mb-20 text-base font-medium text-foreground">Nam</Text>
        </Pressable>

        {/* Female */}
        <Pressable onPress={onPressFemale} className="items-center" android_ripple={{ color: '#00000010', radius: 40 }}>
          <View
            className={`w-40 h-40 rounded-full items-center justify-center
              ${gender === 'female' ? 'bg-warning' : 'bg-background-sub2'}`}
          >
            {/* falling drop */}
            <Animated.View
              pointerEvents="none"
              className={gender === 'female' ? 'absolute -top-6 w-3 h-6 bg-orange-600 rounded-full' : 'absolute -top-6 w-3 h-6 bg-yellow-200 rounded-full'}
              style={{
                transform: [
                  { translateY: femaleDrop.interpolate({ inputRange: [0, 1], outputRange: [-18, 6] }) },
                  { scale: femaleDrop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                  { rotate: '-20deg' },
                ],
                opacity: femaleDrop.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 0] }),
              }}
            />

            <Animated.View
              pointerEvents="none"
              className={
                gender === 'female'
                  ? 'absolute w-40 h-40 rounded-full bg-white/20'
                  : 'absolute w-40 h-40 rounded-full bg-yellow-200/10'
              }
              style={[femaleRippleStyle]}
            />

            <Animated.View style={{ transform: [{ scale: femaleIconScale }] }}>
              <Ionicons name="female" size={56} color={gender === 'female' ? '#fff' : '#F2B94C'} />
            </Animated.View>
          </View>
          <Text className="mt-3 text-base font-medium text-foreground">Nữ</Text>
        </Pressable>
      </View>

      {/* Continue button */}
      <Pressable
        disabled={!canContinue}
        onPress={onNext}
        className={`h-14 rounded-xl items-center justify-center mb-6
          ${canContinue ? 'bg-foreground' : 'bg-inactive'}`}
      >
        <Text className="text-white font-semibold text-base">Tiếp tục</Text>
      </Pressable>
    </View>
  );
}