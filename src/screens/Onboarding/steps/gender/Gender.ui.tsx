import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useGenderLogic } from './Gender.logic';

export default function GenderUI() {
  const { gender, onSelectGender, canContinue, onNext, onBack } =
    useGenderLogic();

  return (
    <View className="flex-1 bg-background ">
      {/* Header */}
      <Pressable onPress={onBack} className="mb-6">
        <Text className="text-secondaryText text-base">← Quay lại</Text>
      </Pressable>

      {/* Title */}
      <Text className="text-xl font-semibold text-foreground text-center">
        Giới Tính Của Bạn?
      </Text>

      <Text className="text-sm text-secondaryText text-center mt-2 px-6">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
        sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </Text>

      {/* Gender options */}
      <View className="flex-1 justify-center space-y-8">
        {/* Male */}
        <Pressable
          onPress={() => onSelectGender('male')}
          className="items-center"
        >
          <View
            className={`w-40 h-40 rounded-full items-center justify-center
              ${gender === 'male'
                ? 'bg-warning'
                : 'bg-background-sub2'}
            `}
          >
            <Ionicons
              name="male"
              size={56}
              color={gender === 'male' ? '#fff' : '#F2B94C'}
            />
          </View>
          <Text className="mt-3 mb-20 text-base font-medium text-foreground">
            Nam
          </Text>
        </Pressable>

        {/* Female */}
        <Pressable
          onPress={() => onSelectGender('female')}
          className="items-center"
        >
          <View
            className={`w-40 h-40 rounded-full items-center justify-center
              ${gender === 'female'
                ? 'bg-warning'
                : 'bg-background-sub2'}
            `}
          >
            <Ionicons
              name="female"
              size={56}
              color={gender === 'female' ? '#fff' : '#F2B94C'}
            />
          </View>
          <Text className="mt-3 text-base font-medium text-foreground">
            Nữ
          </Text>
        </Pressable>
      </View>

      {/* Continue button */}
      <Pressable
        disabled={!canContinue}
        onPress={onNext}
        className={`h-14 rounded-xl items-center justify-center mb-6
          ${canContinue ? 'bg-foreground' : 'bg-inactive'}
        `}
      >
        <Text className="text-white font-semibold text-base">
          Tiếp tục
        </Text>
      </Pressable>
    </View>
  );
}