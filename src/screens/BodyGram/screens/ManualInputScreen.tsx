import React, { useState } from 'react';
import {  Text, TextInput, Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { Measurements } from '../types/measurement';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../../store/onboarding.store';


type Props = NativeStackScreenProps<RootStackParamList, 'ManualInput'>;

export default function ManualInputScreen({ navigation }: Props) {
  const onboarding = useOnboardingStore((s) => s.data);

  const initial: Measurements = {
    shoulder: onboarding?.shoulder,
    waist: onboarding?.waist,
    hip: onboarding?.hip,
    thigh: onboarding?.thigh,
    height_est: onboarding?.height,
    weight_est: onboarding?.weight,
    bust: (onboarding as any)?.bust,
    bicep: (onboarding as any)?.bicep,
    calf: (onboarding as any)?.calf,
  };

  const [form, setForm] = useState<Measurements>(initial);

  const handleChange = (key: keyof Measurements, value: string) => {
    const num = Number(value.replace(',', '.'));
    setForm((prev) => ({
      ...prev,
      [key]: isNaN(num) ? undefined : num,
    }));
  };

  const computeBmi = (heightCm?: number | undefined, weightKg?: number | undefined) => {
    if (!heightCm || !weightKg) return undefined;
    const h = heightCm / 100; // m
    if (h <= 0) return undefined;
    const bmi = weightKg / (h * h);
    return Math.round(bmi * 10) / 10; // one decimal
  };

  const handleSubmit = () => {
    // attach computed BMI
    const bmi = computeBmi(form.height_est, form.weight_est);
    const out = { ...form } as any;
    if (bmi != null) out.bmi = bmi;

    navigation.navigate('Result', { measurements: out });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
    <ScrollView className="flex-1 p-4 bg-slate-50">
      <Text className="text-2xl font-bold mb-4">Nhập số đo thủ công</Text>

      <Text className="mb-1">Chiều cao (cm)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-3 bg-white"
        defaultValue={form.height_est ? String(form.height_est) : ''}
        onChangeText={(val) => handleChange('height_est', val)}
      />

      <Text className="mb-1">Cân nặng (kg)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-3 bg-white"
        defaultValue={form.weight_est ? String(form.weight_est) : ''}
        onChangeText={(val) => handleChange('weight_est', val)}
      />

      {/* show BMI preview when possible */}
      {computeBmi(form.height_est, form.weight_est) ? (
        <View className="mb-3">
          <Text className="text-sm text-secondaryText">BMI ước tính</Text>
          <Text className="text-lg font-semibold">{computeBmi(form.height_est, form.weight_est)}</Text>
        </View>
      ) : null}

      <Text className="mb-1">Ngực (cm)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-3 bg-white"
        defaultValue={form.bust ? String(form.bust) : ''}
        onChangeText={(val) => handleChange('bust', val)}
      />

      <Text className="mb-1">Vai (cm)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-3 bg-white"
        defaultValue={form.shoulder ? String(form.shoulder) : ''}
        onChangeText={(val) => handleChange('shoulder', val)}
      />

      <Text className="mb-1">Eo (cm)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-3 bg-white"
        defaultValue={form.waist ? String(form.waist) : ''}
        onChangeText={(val) => handleChange('waist', val)}
      />

      <Text className="mb-1">Hông (cm)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-3 bg-white"
        defaultValue={form.hip ? String(form.hip) : ''}
        onChangeText={(val) => handleChange('hip', val)}
      />

      <Text className="mb-1">Đùi (cm)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-3 bg-white"
        defaultValue={form.thigh ? String(form.thigh) : ''}
        onChangeText={(val) => handleChange('thigh', val)}
      />

      <Text className="mb-1">Bắp tay (cm)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-3 bg-white"
        defaultValue={form.bicep ? String(form.bicep) : ''}
        onChangeText={(val) => handleChange('bicep', val)}
      />

      <Text className="mb-1">Bắp chân (cm)</Text>
      <TextInput
        keyboardType="numeric"
        className="border rounded-lg px-3 py-2 mb-6 bg-white"
        defaultValue={form.calf ? String(form.calf) : ''}
        onChangeText={(val) => handleChange('calf', val)}
      />

      <Pressable
        className="bg-foreground rounded-xl py-3 items-center"
        onPress={handleSubmit}
      >
        <Text className="text-white font-semibold">Xem kết quả</Text>
      </Pressable>
    </ScrollView>
    </SafeAreaView> 
  );
}
