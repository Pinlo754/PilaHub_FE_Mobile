import React, { useState } from 'react';
import {  Text, TextInput, Pressable, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { Measurements } from '../types/measurement';
import { SafeAreaView } from 'react-native-safe-area-context';


type Props = NativeStackScreenProps<RootStackParamList, 'ManualInput'>;

export default function ManualInputScreen({ navigation }: Props) {
  const [form, setForm] = useState<Measurements>({});

  const handleChange = (key: keyof Measurements, value: string) => {
    const num = Number(value.replace(',', '.'));
    setForm((prev) => ({
      ...prev,
      [key]: isNaN(num) ? undefined : num,
    }));
  };

  const handleSubmit = () => {
    navigation.navigate('Result', { measurements: form });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
    <ScrollView className="flex-1 p-4 bg-slate-50">
      <Text className="text-2xl font-bold mb-4">Nhập số đo thủ công</Text>

      <Text className="mb-1">Vai (cm)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-3 bg-white"
        onChangeText={(val) => handleChange('shoulder', val)}
      />

      <Text className="mb-1">Eo (cm)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-3 bg-white"
        onChangeText={(val) => handleChange('waist', val)}
      />

      <Text className="mb-1">Hông (cm)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-3 bg-white"
        onChangeText={(val) => handleChange('hip', val)}
      />

      <Text className="mb-1">Đùi (cm)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-3 bg-white"
        onChangeText={(val) => handleChange('thigh', val)}
      />

      <Text className="mb-1">Chiều cao (cm)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-6 bg-white"
        onChangeText={(val) => handleChange('height_est', val)}
      />

      <Pressable
        className="bg-blue-600 rounded-xl py-3 items-center"
        onPress={handleSubmit}
      >
        <Text className="text-white font-semibold">Xem kết quả</Text>
      </Pressable>
    </ScrollView>
    </SafeAreaView> 
  );
}
