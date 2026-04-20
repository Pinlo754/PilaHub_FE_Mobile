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
  const labelMap: Record<string, string> = {
    shoulder: 'Vai',
    waist: 'Eo',
    hip: 'Hông',
    thigh: 'Đùi',
    bicep: 'Bắp Tay',
    calf: 'Bắp Chân',
    bodyFatPercent: '% Mỡ Cơ Thể',
    muscleMass: 'Khối Lượng Cơ',
    height: 'Chiều Cao',
    weight: 'Cân Nặng'
  };
  const [modal, setModal] = useState<{ key: string; visible: boolean }>({ key: '', visible: false });
  const onboarding = useOnboardingStore((s) => s.data);
  const setData = useOnboardingStore((s) => s.setData);
  const setStep = useOnboardingStore((s) => s.setStep);
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    setModal({ key: '', visible: false });
  }, []);

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
  }, [setData, onboarding]);

  const openModal = (key: string) => setModal({ key, visible: true });
  const closeModal = () => setModal({ key: '', visible: false });

  const save = (value: number | undefined) => {
    if (modal.key) {
      setData({ [modal.key]: value } as any);
    }
  };

  function computeBmi(heightCm?: number | undefined, weightKg?: number | undefined) {
    if (!heightCm || !weightKg) return undefined;
    const h = heightCm / 100;
    if (h <= 0) return undefined;
    const bmi = weightKg / (h * h);
    return Math.round(bmi * 10) / 10;
  }

  const handleManualSubmit = async () => {
    setToastVisible(false);
    setLoading(true);
    console.log('Manual submit initiated. Onboarding store contents:', onboarding);
    try {
      const bodyGramManual: any = {};
      if (onboarding?.shoulder) bodyGramManual.shoulder = onboarding.shoulder;
      if (onboarding?.waist) bodyGramManual.waist = onboarding.waist;
      if (onboarding?.hip) bodyGramManual.hip = onboarding.hip;
      if (onboarding?.thigh) bodyGramManual.thigh = onboarding.thigh;
      if (onboarding?.bicep) bodyGramManual.bicep = onboarding.bicep;
      if (onboarding?.calf) bodyGramManual.calf = onboarding.calf;
      if (onboarding?.height && onboarding.heightUnit === 'cm') bodyGramManual.height = onboarding.height;
      if (onboarding?.weight && onboarding.weightUnit === 'kg') bodyGramManual.weight = onboarding.weight;
      if (onboarding?.bodyFatPercent != null) bodyGramManual.bodyFatPercentage = onboarding.bodyFatPercent;
      if (onboarding?.muscleMass != null) bodyGramManual.muscleMassKg = onboarding.muscleMass;
      bodyGramManual.input = { source: 'manual' };

      const minimalOnboarding: any = {};
      if (onboarding?.fullName) minimalOnboarding.fullName = onboarding.fullName;
      if (onboarding?.email) minimalOnboarding.email = onboarding.email;
      if (onboarding?.age != null) minimalOnboarding.age = onboarding.age;
      if (onboarding?.gender) minimalOnboarding.gender = onboarding.gender;
      if (onboarding?.workoutFrequency) minimalOnboarding.workoutFrequency = onboarding.workoutFrequency;
      if (onboarding?.workoutLevel) minimalOnboarding.workoutLevel = onboarding.workoutLevel;

      console.log('Built manual payloads. bodyGramManual:', bodyGramManual, 'minimalOnboarding:', minimalOnboarding);

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
        {/* Single absolute back button placed here so it's not covered by header centering */}
        <Pressable
          onPress={() => {
            try {
              const state = navigation.getState?.();
              const routes = state?.routes ?? [];
              const prev = routes[routes.length - 2];
              // if previous route exists and is not the same screen, goBack; otherwise navigate to Onboarding
              if (routes.length >= 2 && prev?.name && prev.name !== 'InputBody') {
                if (navigation.canGoBack && navigation.canGoBack()) navigation.goBack();
                return;
              }
            } catch {}
            try { setStep(6); } catch {}
            navigation.navigate('Onboarding' as any);
          }}
          style={styles.backBtn}
          accessibilityLabel="Quay lại"
          accessibilityRole="button"
        >
          <Text style={styles.backIcon}>{'←'}</Text>
        </Pressable>
        <ScrollView className="flex-1 bg-background p-4" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View className="items-center mb-4" style={styles.headerContainer}>
            <Text className="text-2xl font-semibold text-foreground">Nhập thông tin cơ thể</Text>
            <Text className="text-sm text-secondaryText text-center mt-2 px-6">
              Bạn có thể ước lượng thông tin, không cần chính xác tuyệt đối. Dữ liệu có thể cập nhật bất cứ lúc nào.
            </Text>
          </View>

          {/* Silhouette Card */}
          <View className="bg-white rounded-2xl px-6 pt-6 pb-12 shadow-sm mb-4 overflow-hidden">
            <View className="items-center">
              <View className="w-64 h-80 relative items-center justify-center ">
                <Image source={require('../../../assets/bodygram.png')} style={styles.silhouetteImage as any} resizeMode="contain" />

                <View style={styles.tagWrap1}>
                  <MeasurementTag label="Vai" value={onboarding?.shoulder} unit="cm" onPress={() => openModal('shoulder')} />
                </View>
                <View style={styles.tagWrap2}>
                  <MeasurementTag label="Eo" value={onboarding?.waist} unit="cm" onPress={() => openModal('waist')} />
                </View>
                <View style={styles.tagWrap3}>
                  <MeasurementTag label="Hông" value={onboarding?.hip} unit="cm" onPress={() => openModal('hip')} />
                </View>
                <View style={styles.tagWrap4}>
                  <MeasurementTag label="Đùi" value={onboarding?.thigh} unit="cm" onPress={() => openModal('thigh')} />
                </View>

                <View style={styles.tipBubble}>
                  <View style={styles.tipCard}>
                    <Text style={styles.tipText}>Tip: Ước lượng gần đúng, bạn có thể điều chỉnh sau</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap -mx-2 mb-4">
            <View className="w-1/2 px-2 mb-3">
              <Pressable onPress={() => openModal('bodyFatPercent')}>
                <View style={styles.statCard}>
                  <Text className="text-sm text-secondaryText">% Mỡ Cơ Thể</Text>
                  <Text style={styles.statValue}>{onboarding?.bodyFatPercent != null ? String(onboarding.bodyFatPercent) + '%' : '—'}</Text>
                </View>
              </Pressable>
            </View>
            <View className="w-1/2 px-2 mb-3">
              <Pressable onPress={() => openModal('muscleMass')}>
                <View style={styles.statCard}>
                  <Text className="text-sm text-secondaryText">Khối Lượng Cơ (kg)</Text>
                  <Text style={styles.statValue}>{onboarding?.muscleMass != null ? String(onboarding.muscleMass) + ' kg' : '—'}</Text>
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
                <Text className="text-sm text-secondaryText">Ghi chú</Text>
                <Text style={styles.statValue}>{onboarding?.notes ?? '—'}</Text>
              </View>
            </View>
          </View>

          <View className="flex-row space-x-3 mb-8">
            {/* InBody Scan button */}
            <Pressable className="flex-1 mr-2" onPress={() => navigation.navigate('InBodyScan' as any)} style={[styles.outlineBtn, { alignItems: 'center', justifyContent: 'center' }] }>
              <Text style={styles.outlineBtnText}>InBody Scan</Text>
            </Pressable>

            {/* Camera body scan */}
            <Pressable className="flex-1 mr-2" onPress={() => navigation.navigate('BodyScanFlow' as any)} style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>Dùng camera Quét cơ thể</Text>
            </Pressable>

            {/* Preview/continue */}
            <Pressable
              style={styles.fillBtn}
              onPress={() => {
                console.log('Preview Result pressed. Onboarding store:', onboarding);
                const meas: any = {};
                if (onboarding?.shoulder) meas.shoulder = onboarding.shoulder;
                if (onboarding?.waist) meas.waist = onboarding.waist;
                if (onboarding?.hip) meas.hip = onboarding.hip;
                if (onboarding?.thigh) meas.thigh = onboarding.thigh;
                if (onboarding?.bicep) meas.bicep = onboarding.bicep;
                if (onboarding?.calf) meas.calf = onboarding.calf;
                if (onboarding?.height && onboarding.heightUnit === 'cm') meas.height_est = onboarding.height;
                if (onboarding?.weight && onboarding.weightUnit === 'kg') meas.weight_est = onboarding.weight;

                if (onboarding?.bodyFatPercent != null) {
                  meas.bodyFatPercent = onboarding.bodyFatPercent;
                  meas.bodyFatPercentage = meas.bodyFatPercentage ?? onboarding.bodyFatPercent;
                }
                if (onboarding?.muscleMass != null) {
                  meas.muscleMass = onboarding.muscleMass;
                  meas.muscleMassKg = meas.muscleMassKg ?? onboarding.muscleMass;
                }

                // ensure height/weight are filled from onboarding with simple unit conversions
                if (!meas.height_est && onboarding?.height != null) {
                  const hUnit = (onboarding.heightUnit ?? 'cm') as string;
                  let h = Number(onboarding.height) || 0;
                  if (hUnit === 'm') h = h * 100; // meters -> cm
                  else if (hUnit === 'in' || hUnit === 'inch') h = h * 2.54; // inches -> cm
                  // default assumes cm
                  if (h > 0) meas.height_est = Math.round(h);
                }
                if (!meas.weight_est && onboarding?.weight != null) {
                  const wUnit = (onboarding.weightUnit ?? 'kg') as string;
                  let w = Number(onboarding.weight) || 0;
                  if (wUnit === 'lb' || wUnit === 'lbs') w = w * 0.45359237; // lb -> kg
                  // default assumes kg
                  if (w > 0) meas.weight_est = Math.round(w);
                }

                // mark this preview as coming from manual input so Result can handle context
                meas.input = meas.input ?? {};
                meas.input.source = 'manual';

                const h = meas.height_est ?? onboarding?.height;
                const w = meas.weight_est ?? onboarding?.weight;
                const bmi = computeBmi(h as any, w as any);
                if (bmi != null) meas.bmi = bmi;

                navigation.navigate('Result' as any, { measurements: meas, rawResponse: null, source: 'Manual' });
              }}
            >
              <Text style={styles.fillBtnText}>Tiếp tục</Text>
            </Pressable>
          </View>

      
          {loading ? <LoadingOverlay /> : null}
          <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />

          <MeasurementModal
            visible={modal.visible}
            label={labelMap[modal.key] ?? modal.key}
            initialValue={undefined}
            onClose={closeModal}
            onSave={save}
            unit={modal.key === 'muscleMass' ? 'kg' : modal.key === 'bodyFatPercent' ? '%' : 'cm'}
            subtitle={modal.key === 'bodyFatPercent' ? 'Nhập tỷ lệ phần trăm, ví dụ 18.5' : modal.key === 'muscleMass' ? 'Nhập khối lượng cơ bằng kg' : 'Ước lượng gần đúng. Nhập số theo cm.'}
            placeholder={modal.key === 'bodyFatPercent' ? 'Ví dụ: 18.5' : modal.key === 'muscleMass' ? 'Ví dụ: 55' : 'Ví dụ: 72'}
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
  backBtn: { position: 'absolute', left: 8, top: 8, padding: 12, zIndex: 2000 },
  backIcon: { fontSize: 20, color: '#1f2937', fontWeight: '700', lineHeight: 20 },
  headerContainer: { position: 'relative', paddingTop: 8 },
  headerWrapper: { marginBottom: 16, paddingTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backInlineBtn: { width: 90, justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 24, fontWeight: '600', color: '#111827' },
  headerRightSpacer: { width: 90 },
  statCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, elevation: 3 },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 8 },
  outlineBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { color: 'rgba(0,0,0,0.85)', fontWeight: '700' },
  fillBtn: { backgroundColor: '#b5651d', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  fillBtnText: { color: '#fff', fontWeight: '700' },
});