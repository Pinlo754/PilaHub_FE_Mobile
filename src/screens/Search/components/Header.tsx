import React, { useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import Ionicons from '@react-native-vector-icons/ionicons';

const Header = () => {
  // NAVIGATION
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // STATE
  const [focused, setFocused] = useState(false);

  // COLOR
  const FOREGROUND = '#A0522D';
  const INACTIVE_DARKER = 'rgba(107, 114, 128, 0.5)';

  return (
    <View className="flex-row justify-between items-center gap-8 px-4">
      {/* Back */}
      <View className="">
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={24} color={FOREGROUND} />
        </Pressable>
      </View>

      {/* Input */}
      <View
        className={`flex-grow flex-row justify-between items-center bg-white shadow-sm elevation-6 border rounded-lg ${focused ? 'border-foreground' : 'border-background-sub1'}`}
      >
        <TextInput
          className={`color-foreground font-medium px-3 py-3 text-lg`}
          placeholder="Tìm kiếm..."
          placeholderTextColor={INACTIVE_DARKER}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        <Pressable className="px-3" onPress={() => navigation.goBack()}>
          <Ionicons name="search" size={24} color={FOREGROUND} />
        </Pressable>
      </View>

      {/* Filter */}
      <View className="">
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="options-outline" size={24} color={FOREGROUND} />
        </Pressable>
      </View>
    </View>
  );
};

export default Header;
