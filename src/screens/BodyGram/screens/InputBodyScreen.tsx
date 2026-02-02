import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import MeasurementTag from '../components/MeasurementTag';
import MeasurementModal from '../components/MeasurementModal';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'InputBody'>;

export default function InputBodyScreen({ navigation }: Props) {
  const [modal, setModal] = useState<{ key: string; visible: boolean }>({ key: '', visible: false });
  const onboarding = useOnboardingStore((s) => s.data);
  const setData = useOnboardingStore((s) => s.setData);

  const openModal = (key: string) => setModal({ key, visible: true });
  const closeModal = () => setModal({ key: '', visible: false });

  const save = (value: number | undefined) => {
    if (modal.key) {
      setData({ [modal.key]: value } as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background ">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView className="flex-1 bg-background p-4" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View className="items-center mb-4">
            <Text className="text-2xl font-semibold text-foreground">Nhập thông tin cơ thể</Text>
            <Text className="text-sm text-secondaryText text-center mt-2 px-6">
              Bạn có thể ước lượng thông tin, không cần chính xác tuyệt đối. Dữ liệu có thể cập nhật bất cứ lúc nào.
            </Text>
          </View>

          {/* Silhouette Card */}
          <View className="bg-white rounded-2xl px-6 pt-6 pb-12 shadow-sm mb-4 overflow-hidden">
            <View className="items-center">
              <View className="w-64 h-80 relative items-center justify-center">
                <Image source={require('../../../assets/bodygram.png')} style={styles.silhouetteImage} resizeMode="contain" />

                {/* Tags positioned with stylesheet for precision */}
                <View style={styles.tagWrap1} >
                  <MeasurementTag label="Vai" value={onboarding?.shoulder} onPress={() => openModal('shoulder')} />
                </View>
                <View style={styles.tagWrap2}>
                  <MeasurementTag label="Eo" value={onboarding?.waist} onPress={() => openModal('waist')} />
                </View>
                <View style={styles.tagWrap3}>
                  <MeasurementTag label="Hông" value={onboarding?.hip} onPress={() => openModal('hip')} />
                </View>
                <View style={styles.tagWrap4}>
                  <MeasurementTag label="Đùi" value={onboarding?.thigh} onPress={() => openModal('thigh')} />
                </View>

                {/* Tip bubble */}
                <View style={styles.tipBubble}>
                  <View style={styles.tipCard}>
                    <Text style={styles.tipText}>Tip: Ước lượng gần đúng, bạn có thể điều chỉnh sau</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Quick stats mock (mirrors Figma) */}
          <View className="flex-row flex-wrap -mx-2 mb-4">
            <View className="w-1/2 px-2 mb-3">
              <View style={styles.statCard}>
                <Text className="text-sm text-secondaryText">% Mỡ Cơ Thể</Text>
                <Text style={styles.statValue}>{onboarding?.bodyFatPercent ?? '—'}</Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-3">
              <View style={styles.statCard}>
                <Text className="text-sm text-secondaryText">Khối Lượng Cơ</Text>
                <Text style={styles.statValue}>{onboarding?.muscleMass ?? '—'}</Text>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-3">
              <View style={styles.statCard}>
                <Text className="text-sm text-secondaryText">BMI</Text>
                <Text style={styles.statValue}>{onboarding?.bmi ?? '—'}</Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-3">
              <View style={styles.statCard}>
                <Text className="text-sm text-secondaryText">Cân Nhắc</Text>
                <Text style={styles.statValue}>{onboarding?.notes ?? '—'}</Text>
              </View>
            </View>
          </View>

          {/* Actions: camera or continue -> Result using values from InputBody (skip ManualInput) */}
          <View className="flex-row space-x-3 mb-8">
            <Pressable className="flex-1" onPress={() => navigation.navigate('BodyScanFlow')} style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>Dùng camera Quét cơ thể</Text>
            </Pressable>
            <Pressable
              style={styles.fillBtn}
              onPress={() => {
                // Build a measurements object compatible with ResultScreen's expectations
                const meas: any = {};
                if (onboarding?.shoulder) meas.shoulder = onboarding.shoulder;
                if (onboarding?.waist) meas.waist = onboarding.waist;
                if (onboarding?.hip) meas.hip = onboarding.hip;
                if (onboarding?.thigh) meas.thigh = onboarding.thigh;
                if (onboarding?.bicep) meas.bicep = onboarding.bicep;
                if (onboarding?.calf) meas.calf = onboarding.calf;
                // height/weight fallback
                if (onboarding?.height && onboarding.heightUnit === 'cm') meas.height_est = onboarding.height;
                if (onboarding?.weight && onboarding.weightUnit === 'kg') meas.weight_est = onboarding.weight;

                navigation.navigate('Result', { measurements: meas, rawResponse: null });
              }}
            >
              <Text style={styles.fillBtnText}>Tiếp tục</Text>
            </Pressable>
          </View>

          <MeasurementModal
            visible={modal.visible}
            label={modal.key}
            initialValue={undefined}
            onClose={closeModal}
            onSave={save}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  tagWrap1: { position: 'absolute', top: 36, left: -12 },
  tagWrap2: { position: 'absolute', top: 120, left: 30 },
  tagWrap3: { position: 'absolute', top: 124, right: 8 },
  tagWrap4: { position: 'absolute', bottom: 36, left: 36 },
  silhouetteImage: { width: '100%', height: '100%' },
  tipBubble: { position: 'absolute', bottom: -30, left: 16, right: 16, alignItems: 'center' },
  tipCard: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 4 },
  tipText: { color: '#555', textAlign: 'center' },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, elevation: 3 },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 8 },
  outlineBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { color: 'rgba(0,0,0,0.85)', fontWeight: '700' },
  fillBtn: { backgroundColor: '#b5651d', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  fillBtnText: { color: '#fff', fontWeight: '700' },
});
