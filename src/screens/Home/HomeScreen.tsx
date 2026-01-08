import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-background-sub2">
    <View className="flex-1 items-center justify-center bg-background-sub2">
      <Text className="text-2xl font-bold mb-6 text-red-500">
        Home Screen
      </Text>

      <Pressable
        onPress={() => navigation.navigate('Login')}
        className="bg-blue-500 px-6 py-3 rounded-xl"
      >
        <Text className="text-white font-semibold">
          Go to Login
        </Text>
      </Pressable>
    </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
