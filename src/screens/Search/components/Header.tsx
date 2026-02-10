import React, { useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';

const Header = () => {
  // NAVIGATION
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // STATE
  const [focused, setFocused] = useState(false);

  return (
    <View className="flex-row justify-between items-center gap-8 px-4">
      {/* Back */}
      <View className="">
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={colors.foreground}
          />
        </Pressable>
      </View>

      {/* Input */}
      <View
        className={`flex-grow flex-row justify-between items-center bg-white shadow-md elevation-md border rounded-lg ${focused ? 'border-foreground' : 'border-background-sub1'}`}
      >
        <TextInput
          className={`color-foreground font-medium px-3 py-3 text-lg`}
          placeholder="Tìm kiếm..."
          placeholderTextColor={colors.inactive.darker}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        <Pressable className="px-3" onPress={() => navigation.goBack()}>
          <Ionicons name="search" size={24} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Filter */}
      <View className="">
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons
            name="options-outline"
            size={24}
            color={colors.foreground}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default Header;
