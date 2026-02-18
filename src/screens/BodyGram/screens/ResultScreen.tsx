import React, { useMemo, useState } from 'react';
import { Text, ScrollView, View, Button,  Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import BodySilhouetteOverlay from '../components/BodySilhouetteOverlay';
import { useOnboardingStore } from '../../../store/onboarding.store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { submitProfiles, buildTraineeProfilePayload } from '../../../services/profile';
import LoadingOverlay from '../../../components/LoadingOverlay';
import Toast from '../../../components/Toast';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

function mmToCm(mm?: number | null) {
  if (mm == null) return undefined;
  const n = Number(mm);
  if (isNaN(n)) return undefined;
  return +(n / 10).toFixed(0); // round to integer cm like design
}
function gToKg(g?: number | null) {
  if (g == null) return undefined;
  const n = Number(g);
  if (isNaN(n)) return undefined;
  return +(n / 1000).toFixed(0);
}

export default function ResultScreen({ route, navigation }: Props) {
  const { measurements: rawMeasurements, rawResponse } = route.params as any;
  const setData = useOnboardingStore((s) => s.setData);
  const onboarding = useOnboardingStore((s) => s.data);
 
  // summary (prefer store values for height/weight if present)
  const summary = useMemo(() => {
    const heightFromStore = onboarding?.height && (onboarding.heightUnit === 'cm' ? onboarding.height : undefined);
    const weightFromStore = onboarding?.weight && (onboarding.weightUnit === 'kg' ? onboarding.weight : undefined);

    const entry = rawResponse?.entry ?? rawResponse ?? {};
    const input = entry?.input?.photoScan ?? entry?.input ?? {};

    const hRaw = input?.height ?? input?.heightMm ?? null;
    const wRaw = input?.weight ?? input?.weightG ?? null;

    const height = heightFromStore ?? (typeof hRaw === 'number' ? (hRaw > 1000 ? mmToCm(hRaw) : hRaw) : undefined);
    const weight = weightFromStore ?? (typeof wRaw === 'number' ? (wRaw > 500 ? gToKg(wRaw) : wRaw) : undefined);
    const age = input?.age ?? onboarding?.age ?? undefined;
    const gender = input?.gender ?? onboarding?.gender ?? undefined;

    return { height, weight, age, gender };
  }, [rawResponse, onboarding]);

  // normalize measurement array into friendly keys (cm)
  const display = useMemo(() => {
    if (rawMeasurements && !Array.isArray(rawMeasurements)) return rawMeasurements;
    const arr: any[] = Array.isArray(rawMeasurements) ? rawMeasurements : rawResponse?.entry?.measurements ?? rawResponse?.measurements ?? [];
    const out: any = {};

    arr.forEach((m: any) => {
      const name = (m.name || m.key || '').toString().toLowerCase();
      const unit = (m.unit || '').toString().toLowerCase();
      const val = m.value ?? m.value_mm ?? m.value_cm ?? m.cm ?? m.mm ?? null;
      const num = val != null ? Number(val) : null;
      const asCm = num == null ? null : unit === 'mm' ? mmToCm(num) : unit === 'cm' ? Math.round(num) : Math.round(num);

      if (!name) return;
      if (name.includes('bust') || name.includes('chest') || name.includes('bustgirth')) out.bust = asCm;
      else if (name.includes('waist') || name.includes('belly') || name.includes('vong eo') || name.includes('bellywaist')) out.waist = asCm;
      else if (name.includes('hip') || name.includes('hipgirth') || name.includes('tophip')) out.hip = asCm;
      else if (name.includes('thigh') || name.includes('thighgirth') || name.includes('midthigh')) out.thigh = asCm;
      else if (name.includes('calf') || name.includes('calfgirth')) out.calf = asCm;
      else if (name.includes('forearm') || name.includes('forearmgirth') || name.includes('wrist')) out.forearm = asCm;
      else if (name.includes('shoulder') || name.includes('acrossbackshoulder')) out.shoulder = asCm;
      else if (name.includes('upperarm') || name.includes('bicep') || name.includes('arm')) out.bicep = asCm;
      else if (name.includes('height') || name.includes('stature') || name.includes('heightmm')) out.height_est = unit === 'mm' ? mmToCm(num) : Math.round(num as any);
      else if (name.includes('weight') || name.includes('mass')) out.weight_est = unit === 'g' ? gToKg(num) : Math.round(num as any);
    });

    // fallback to input values if missing
    if (!out.height_est && rawResponse?.entry?.input?.photoScan?.height) {
      const h = rawResponse.entry.input.photoScan.height;
      out.height_est = h > 1000 ? mmToCm(h) : h;
    }
    if (!out.weight_est && rawResponse?.entry?.input?.photoScan?.weight) {
      const w = rawResponse.entry.input.photoScan.weight;
      out.weight_est = w > 500 ? gToKg(w) : w;
    }

    return out;
  }, [rawMeasurements, rawResponse]);

  const whr = display.waist && display.hip ? (display.waist / display.hip).toFixed(2) : undefined;

  const saveMeasurements = async () => {
    try {
      // Map common fields back to onboarding store
      const map: any = {};
      if (display.shoulder) map.shoulder = display.shoulder;
      if (display.waist) map.waist = display.waist;
      if (display.hip) map.hip = display.hip;
      if (display.thigh) map.thigh = display.thigh;
      if (display.height_est) map.height = display.height_est;
      if (display.weight_est) map.weight = display.weight_est;

      if (Object.keys(map).length > 0) {
        setData(map);
        await AsyncStorage.setItem('bodygram:savedMeasurements', JSON.stringify(display));
        Alert.alert('Lưu thành công', 'Số đo đã được lưu vào hồ sơ.');
      } else {
        Alert.alert('Không có số đo', 'Không tìm thấy số đo hợp lệ để lưu.');
      }
    } catch (e) {
      console.log('Save measurements error', e);
      Alert.alert('Lỗi', 'Không thể lưu số đo.');
    }
  };
  
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const handleSubmitAll = async () => {
    setToastVisible(false);
    setLoading(true);
    try {
      // prefer the normalized display measurements for API payloads
      const entry = rawResponse?.entry ?? rawResponse ?? {};
      // merge: display fields (cleaned, cm/kg) should take precedence for health profile
      const bodyGramForApi = { ...entry, ...display };

      // log payload about to be sent
      try {
        const traineePayload = buildTraineeProfilePayload(onboarding, bodyGramForApi);
        console.log('submitProfiles -> traineePayload', traineePayload);
        console.log('submitProfiles -> bodyGram (sample keys)', Object.keys(bodyGramForApi).slice(0,20));
      } catch (e) {
        console.warn('Error building traineePayload for logging', e);
      }

      const res = await submitProfiles(onboarding, bodyGramForApi, 'BodyGram');
      setLoading(false);
      console.log('submitProfiles result', res);
      if (res.ok) {
        // save measurements locally as well
        await saveMeasurements();
        setToastType('success');
        setToastMsg('Lưu hồ sơ thành công');
        setToastVisible(true);
        // short delay to show toast then navigate
        setTimeout(() => navigation.replace('MainTabs'), 700);
      } else {
        // log detailed error for debugging
        const msg = typeof res.error === 'string' ? res.error : JSON.stringify(res.error);
        console.warn('submitProfiles error', res.error);
        // if server error object exists, print status and data
        if (res.error && typeof res.error === 'object') {
          try {
            console.error('submitProfiles error details:', res.error);
          } catch (e) {
            console.warn('Could not stringify error details', e);
          }
        }
        setToastType('error');
        setToastMsg(`Lỗi khi lưu: ${msg}`);
        setToastVisible(true);
        Alert.alert('Lỗi', msg);
      }
    } catch (e: any) {
      setLoading(false);
      const msg = e?.message ?? String(e);
      console.error('submitProfiles thrown error', e);
      setToastType('error');
      setToastMsg(`Lỗi khi lưu: ${msg}`);
      setToastVisible(true);
      Alert.alert('Lỗi', msg);
    }
  };
 console.log('Rendered ResultScreen with measurements:', saveMeasurements);
   return (
     <SafeAreaView className="flex-1 bg-background"><ScrollView className="flex-1  p-4">
      {/* HEADER SUMMARY */}
      <View className="bg-amber-100 rounded-md p-3 mb-4">
        <Text className="text-sm text-gray-700">{`Chiều cao: ${summary.height ?? '-'}cm   Cân nặng: ${summary.weight ?? '-'}kg   ${summary.age ?? ''} tuổi   ${summary.gender ?? ''}`}</Text>
      </View>

      {/* SILHOUETTE CARD */}
      <View className="bg-white rounded-xl p-4 items-center mb-4">
        <View className="w-64 h-80 items-center justify-center">
          {/* If you add a 3D image asset at src/assets/body_3d.png you can replace the overlay with:
              <Image source={require('../../../assets/body_3d.png')} className="w-full h-full" resizeMode="contain" />
              For now use the SVG overlay to avoid missing-asset crashes.
          */}
          <BodySilhouetteOverlay mode="front" />

          {/* use the provided body image asset */}
          <Image source={require('../../../assets/bodygram.png')} className="w-full h-full" resizeMode="contain" />

          {/* bubbles positioned approx; adjust with design */}
          <View className="absolute top-8 left-3">
            <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
              <Text className="text-xs text-gray-800">Ngực</Text>
              <Text className="text-lg font-extrabold">{display.bust ?? '-'}cm</Text>
            </View>
          </View>

          <View className="absolute top-24 left-4">
            <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
              <Text className="text-xs text-gray-800">Eo</Text>
              <Text className="text-lg font-extrabold">{display.waist ?? '-'}cm</Text>
            </View>
          </View>

          <View className="absolute top-24 right-4">
            <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
              <Text className="text-xs text-gray-800">Hông</Text>
              <Text className="text-lg font-extrabold">{display.hip ?? '-'}cm</Text>
            </View>
          </View>

          <View className="absolute bottom-9 left-7">
            <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
              <Text className="text-xs text-gray-800">Đùi</Text>
              <Text className="text-lg font-extrabold">{display.thigh ?? '-'}cm</Text>
            </View>
          </View>

          <View className="absolute top-9 right-7">
            <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
              <Text className="text-xs text-gray-800">Bắp tay</Text>
              <Text className="text-lg font-extrabold">{display.bicep ?? '-'}cm</Text>
            </View>
          </View>
        </View>
      </View>

      {/* HEALTH CARD */}
      <View className="bg-amber-100 rounded-xl p-4 mb-4">
        <Text className="text-base font-semibold mb-2">Chỉ số sức khỏe</Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-sm text-gray-700">Waist-to-Hip Ratio</Text>
          <Text className="text-xl font-extrabold">{whr ?? '-'}</Text>
        </View>
      </View>

      {/* DETAIL TILES */}
      <Text className="text-lg font-extrabold mb-3">Số đo chi tiết</Text>
      <View className="flex-row flex-wrap -m-2">
        {[
          { key: 'bust', label: 'Ngực' },
          { key: 'waist', label: 'Eo' },
          { key: 'hip', label: 'Hông' },
          { key: 'bicep', label: 'Bắp tay' },
          { key: 'thigh', label: 'Đùi' },
          { key: 'calf', label: 'Bắp chân' },
        ].map((t) => (
          <View key={t.key} className="w-1/2 p-2">
            <View className="bg-background-sub2 rounded-xl p-4 shadow">
              <Text className="text-sm text-gray-700">{t.label}</Text>
              <Text className="text-2xl font-extrabold mt-2">{display[t.key] ?? '-'}cm</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ACTIONS */}
      <View className="mt-6 bg-foreground p-2 rounded-lg " >
       <Button title ="Lưu kết quả" onPress={handleSubmitAll} color="white" disabled={loading} />
        {/* <Button title="Lưu kết quả" onPress={saveMeasurements} color="white" /> */}
      </View>

      {loading ? <LoadingOverlay message="Đang lưu hồ sơ..." /> : null}
      <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />

     </ScrollView></SafeAreaView>
     
   );
 }
