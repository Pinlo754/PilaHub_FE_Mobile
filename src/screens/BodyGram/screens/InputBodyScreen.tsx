import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import MeasurementTag from '../components/MeasurementTag';
import MeasurementModal from '../components/MeasurementModal';
import { useOnboardingStore } from '../../../store/onboarding.store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitProfiles } from '../../../services/profile';
import LoadingOverlay from '../../../components/LoadingOverlay';
import Toast from '../../../components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'InputBody'>;

export default function InputBodyScreen({ navigation }: Props) {
  const [modal, setModal] = useState<{ key: string; visible: boolean }>({ key: '', visible: false });
  const onboarding = useOnboardingStore((s) => s.data);
  const setData = useOnboardingStore((s) => s.setData);
  const setStep = useOnboardingStore((s) => s.setStep);
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  // Do not reset onboarding here — preserve entered info (name, email) for manual submit
  useEffect(() => {
    setModal({ key: '', visible: false });
  }, []);

  // Try to hydrate body composition results from last Bodygram run (debug + UX):
  // - Prefer compact 'bodygram:lastMeasurements' (saved by BodyScanFlow)
  // - Fallback to 'bodygram:lastResponse' and extract common fields
  // Do not override values already present in onboarding store.
  const hydrateRanRef = useRef(false);
  useEffect(() => {
    if (hydrateRanRef.current) return;
    (async () => {
      hydrateRanRef.current = true;
      try {
        const measRaw = await AsyncStorage.getItem('bodygram:lastMeasurements');
        if (measRaw) {
          const meas = JSON.parse(measRaw || '{}');
          const update: any = {};
          if ((meas.bodyFatPercentage ?? meas.body_fat ?? meas.bodyfat) != null && (onboarding?.bodyFatPercent == null)) update.bodyFatPercent = meas.bodyFatPercentage ?? meas.body_fat ?? meas.bodyfat;
          if ((meas.muscleMassKg ?? meas.muscle_mass_kg ?? meas.musclemass) != null && (onboarding?.muscleMass == null)) update.muscleMass = meas.muscleMassKg ?? meas.muscle_mass_kg ?? meas.musclemass;

          if (Object.keys(update).length > 0) {
            setData(update);
            console.log('Hydrated onboarding from bodygram:lastMeasurements', update);
            console.log('Onboarding store before hydration update:', onboarding);
            console.log('Applied hydration update:', update);
            return;
          }
        }

        const respRaw = await AsyncStorage.getItem('bodygram:lastResponse');
        if (respRaw) {
          const resp = JSON.parse(respRaw || '{}');
          const entry = resp.entry ?? resp;
          const bc = entry.bodyComposition ?? entry.body_composition ?? entry.bodyCompositionResult ?? entry.bodyCompositionResult ?? {};
          const update: any = {};

          if ((bc.bodyFatPercentage ?? bc.bodyFatPercent ?? bc.body_fat) != null && (onboarding?.bodyFatPercent == null)) update.bodyFatPercent = bc.bodyFatPercentage ?? bc.bodyFatPercent ?? bc.body_fat;
          if ((bc.muscleMassKg ?? bc.muscle_mass_kg ?? bc.muscle_mass) != null && (onboarding?.muscleMass == null)) update.muscleMass = bc.muscleMassKg ?? bc.muscle_mass_kg ?? bc.muscle_mass;

          // some providers put values at top-level fields too
          if ((resp.bodyFatPercentage ?? resp.body_fat) != null && (onboarding?.bodyFatPercent == null)) update.bodyFatPercent = update.bodyFatPercent ?? resp.bodyFatPercentage ?? resp.body_fat;
          if ((resp.muscleMassKg ?? resp.muscle_mass) != null && (onboarding?.muscleMass == null)) update.muscleMass = update.muscleMass ?? resp.muscleMassKg ?? resp.muscle_mass;

          if (Object.keys(update).length > 0) {
            setData(update);
            console.log('Hydrated onboarding from bodygram:lastResponse', update);
            console.log('Onboarding store before hydration update:', onboarding);
            console.log('Applied hydration update:', update);
          }
        }
      } catch (e) {
        console.warn('Could not hydrate bodygram results into onboarding', e);
      }
    })();
  }, [setData, onboarding?.bodyFatPercent, onboarding?.muscleMass]);

  const openModal = (key: string) => setModal({ key, visible: true });
  const closeModal = () => setModal({ key: '', visible: false });

  const save = (value: number | undefined) => {
    if (modal.key) {
      setData({ [modal.key]: value } as any);
    }
  };

  function computeBmi(heightCm?: number | undefined, weightKg?: number | undefined) {
    if (!heightCm || !weightKg) return undefined;
    const h = heightCm / 100; // m
    if (h <= 0) return undefined;
    const bmi = weightKg / (h * h);
    return Math.round(bmi * 10) / 10; // one decimal
  }

  const handleManualSubmit = async () => {
    setToastVisible(false);
    setLoading(true);
    console.log('Manual submit initiated. Onboarding store contents:', onboarding);
    try {
      // build a bodyGram-like payload from manual inputs so server receives similar structure
      const bodyGramManual: any = {};
      // measurements
      if (onboarding?.shoulder) bodyGramManual.shoulder = onboarding.shoulder;
      if (onboarding?.waist) bodyGramManual.waist = onboarding.waist;
      if (onboarding?.hip) bodyGramManual.hip = onboarding.hip;
      if (onboarding?.thigh) bodyGramManual.thigh = onboarding.thigh;
      if (onboarding?.bicep) bodyGramManual.bicep = onboarding.bicep;
      if (onboarding?.calf) bodyGramManual.calf = onboarding.calf;
      // height/weight
      if (onboarding?.height && onboarding.heightUnit === 'cm') bodyGramManual.height = onboarding.height;
      if (onboarding?.weight && onboarding.weightUnit === 'kg') bodyGramManual.weight = onboarding.weight;
      // body composition
      if (onboarding?.bodyFatPercent != null) bodyGramManual.bodyFatPercentage = onboarding.bodyFatPercent;
      if (onboarding?.muscleMass != null) bodyGramManual.muscleMassKg = onboarding.muscleMass;
      // attach input metadata
      bodyGramManual.input = { source: 'manual' };

      // Build a minimal trainee payload from onboarding store (use stored values)
      const minimalOnboarding: any = {};
      if (onboarding?.fullName) minimalOnboarding.fullName = onboarding.fullName;
      if (onboarding?.email) minimalOnboarding.email = onboarding.email;
      if (onboarding?.age != null) minimalOnboarding.age = onboarding.age;
      if (onboarding?.gender) minimalOnboarding.gender = onboarding.gender;
      // include workout preferences if user selected them during onboarding
      if (onboarding?.workoutFrequency) minimalOnboarding.workoutFrequency = onboarding.workoutFrequency;
      if (onboarding?.workoutLevel) minimalOnboarding.workoutLevel = onboarding.workoutLevel;

      console.log('Built manual payloads. bodyGramManual:', bodyGramManual, 'minimalOnboarding:', minimalOnboarding);

      // require at least name + email for creating trainee on server
      // if workout preferences missing, ask user to complete Workout step first
      if (!onboarding?.workoutFrequency || !onboarding?.workoutLevel) {
        setLoading(false);
        Alert.alert(
          'Thiếu lựa chọn tập luyện',
          'Bạn cần hoàn tất phần lựa chọn tần suất và mức độ tập luyện trước khi gửi thủ công.',
          [
            { text: 'Đi tới Workout', onPress: () => { setStep(5); navigation.navigate('Onboarding' as any); } },
            { text: 'Hủy', style: 'cancel' },
          ]
        );
        return;
      }

      if (!minimalOnboarding.fullName || !minimalOnboarding.email) {
        setLoading(false);
        Alert.alert(
          'Thiếu thông tin',
          'Vui lòng hoàn tất tên và email trong hồ sơ trước khi gửi thủ công.',
          [{ text: 'OK' }]
        );
        return;
      }

      const res = await submitProfiles(minimalOnboarding as any, bodyGramManual, 'Manual');
      setLoading(false);
      console.log('submitProfiles (manual) result', res);
      if (res.ok) {
        setToastType('success');
        setToastMsg('Lưu hồ sơ thành công');
        setToastVisible(true);
        setTimeout(() => navigation.replace('MainTabs' as any), 700);
      } else {
        setToastType('error');
        setToastMsg('Lưu thất bại');
        setToastVisible(true);
        Alert.alert('Lỗi', JSON.stringify(res.error ?? res));
      }
    } catch (e: any) {
      setLoading(false);
      console.log('submitProfiles manual error', e);
      setToastType('error');
      setToastMsg('Lỗi khi gửi hồ sơ');
      setToastVisible(true);
      Alert.alert('Lỗi', e?.message ?? String(e));
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
              <View className="w-64 h-80 relative items-center justify-center ">
                <Image source={require('../../../assets/bodygram.png')} style={styles.silhouetteImage} resizeMode="contain"  />

                {/* Tags positioned with stylesheet for precision */}
                <View style={styles.tagWrap1} >
                  <MeasurementTag label="Vai" value={onboarding?.shoulder} onPress={() => openModal('shoulder')}  />
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
                <View style={styles.tipBubble} >
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
              <Pressable onPress={() => openModal('bodyFatPercent')}> 
                <View style={styles.statCard}>
                  <Text className="text-sm text-secondaryText">% Mỡ Cơ Thể</Text>
                  <Text style={styles.statValue}>{onboarding?.bodyFatPercent ?? '—'}</Text>
                </View>
              </Pressable>
            </View>
            <View className="w-1/2 px-2 mb-3">
              <Pressable onPress={() => openModal('muscleMass')}>
                <View style={styles.statCard}>
                  <Text className="text-sm text-secondaryText">Khối Lượng Cơ (kg)</Text>
                  <Text style={styles.statValue}>{onboarding?.muscleMass ?? '—'}</Text>
                </View>
              </Pressable>
            </View>

            <View className="w-1/2 px-2 mb-3">
              <View style={styles.statCard}>
                <Text className="text-sm text-secondaryText">BMI</Text>
                <Text style={styles.statValue}>{onboarding?.bmi ?? computeBmi(onboarding?.height, onboarding?.weight) ?? '—'}</Text>
              </View>
            </View>
            <View className="w-1/2 px-2 mb-3">
              <View style={styles.statCard}>
                <Text className="text-sm text-secondaryText">Cân Nhắc</Text>
                <Text style={styles.statValue}>{onboarding?.notes ?? '—'}</Text>
              </View>
            </View>
          </View>

          {/* Actions: camera, preview Result, or submit manual */}
          <View className="flex-row space-x-3 mb-8">
            <Pressable className="flex-1" onPress={() => navigation.navigate('BodyScanFlow')} style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>Dùng camera Quét cơ thể</Text>
            </Pressable>
            <Pressable
              style={styles.fillBtn}
              onPress={() => {
                console.log('Preview Result pressed. Onboarding store:', onboarding);
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

                // include body composition fields if available under common names
                if (onboarding?.bodyFatPercent != null) {
                  meas.bodyFatPercent = onboarding.bodyFatPercent;
                  meas.bodyFatPercentage = meas.bodyFatPercentage ?? onboarding.bodyFatPercent;
                }
                if (onboarding?.muscleMass != null) {
                  meas.muscleMass = onboarding.muscleMass;
                  meas.muscleMassKg = meas.muscleMassKg ?? onboarding.muscleMass;
                }

                // compute BMI if we have height & weight
                const h = meas.height_est ?? onboarding?.height;
                const w = meas.weight_est ?? onboarding?.weight;
                const bmi = computeBmi(h as any, w as any);
                if (bmi != null) meas.bmi = bmi;

                navigation.navigate('Result', { measurements: meas, rawResponse: null });
              }}
            >
              <Text style={styles.fillBtnText}>Tiếp tục</Text>
            </Pressable>
          </View>

          <View className="mb-6">
            <Pressable onPress={handleManualSubmit} style={styles.fillBtn} className="items-center justify-center">
              <Text style={styles.fillBtnText}>Gửi thủ công</Text>
            </Pressable>
          </View>

          {loading ? <LoadingOverlay message="Đang gửi hồ sơ..." /> : null}
          <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />

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
  tagWrap2: { position: 'absolute', top: 120, left: 10 },
  tagWrap3: { position: 'absolute', top: 124, right: 8 },
  tagWrap4: { position: 'absolute', bottom: 36, left: 20 },
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