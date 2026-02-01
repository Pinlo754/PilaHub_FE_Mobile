import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';


type Props = NativeStackScreenProps<RootStackParamList, 'MethodSelect'>;

export default function MethodSelectScreen({ navigation }: Props) {
  return (
    <View className="flex-1 p-4 justify-center bg-slate-50">
      <Text className="text-2xl font-bold mb-6">
        Chọn cách nhập số đo cơ thể
      </Text>

      <Pressable
        className="p-4 bg-white rounded-xl mb-4 shadow-sm"
        onPress={() => navigation.navigate('ManualInput')}
      >
        <Text className="text-lg font-semibold mb-1">
          Nhập số đo thủ công
        </Text>
        <Text className="text-gray-600">
          Bạn tự nhập vai, eo, hông, đùi, chiều cao...
        </Text>
      </Pressable>

      <Pressable
        className="p-4 bg-white rounded-xl shadow-sm"
        onPress={() => navigation.navigate('BodyScanFlow')}
      >
        <Text className="text-lg font-semibold mb-1">
          Quét bằng camera (Bodygram)
        </Text>
        <Text className="text-gray-600">
          Chụp 2 ảnh (trước & bên hông), hệ thống sẽ ước lượng số đo.
        </Text>
      </Pressable>
    </View>
  );
}
