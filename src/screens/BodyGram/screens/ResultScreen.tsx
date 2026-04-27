import React, { useMemo, useState } from 'react';
import { Text, ScrollView, View, TouchableOpacity, ActivityIndicator, Image, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useOnboardingStore } from '../../../store/onboarding.store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildTraineeProfilePayload, submitTraineeProfile, submitPersonalInjuries, submitHealthProfile } from '../../../services/profile';
import LoadingOverlay from '../../../components/LoadingOverlay';
import Toast from '../../../components/Toast';
import { getProfile } from '../../../services/auth';
import { setBodySavedFor } from '../../../utils/bodyCache';
import ModalPopup from '../../../components/ModalPopup';

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
  // capture navigation source so we can preserve context ('BodyGram' | 'Manual' | ...)
  const source = (route.params as any)?.source ?? 'BodyGram';
  const setData = useOnboardingStore((s) => s.setData);
  const onboarding = useOnboardingStore((s) => s.data);
 
  // summary (prefer store values for height/weight if present)
  const summary = useMemo(() => {
    const heightFromStore = onboarding?.height && (onboarding.heightUnit === 'cm' ? onboarding.height : undefined);
    const weightFromStore = onboarding?.weight && (onboarding.weightUnit === 'kg' ? onboarding.weight : undefined);

    // if the screen received a manual measurements object (not array), prefer values from it
    const measurementsObj = rawMeasurements && !Array.isArray(rawMeasurements) ? rawMeasurements : undefined;

    const entry = rawResponse?.entry ?? rawResponse ?? {};
    const input = entry?.input?.photoScan ?? entry?.input ?? {};

    const hRaw = input?.height ?? input?.heightMm ?? measurementsObj?.height_est ?? measurementsObj?.height ?? null;
    const wRaw = input?.weight ?? input?.weightG ?? measurementsObj?.weight_est ?? measurementsObj?.weight ?? null;

    const height = heightFromStore ?? (typeof hRaw === 'number' ? (hRaw > 1000 ? mmToCm(hRaw) : hRaw) : undefined);
    const weight = weightFromStore ?? (typeof wRaw === 'number' ? (wRaw > 500 ? gToKg(wRaw) : wRaw) : undefined);
    const age = input?.age ?? onboarding?.age ?? undefined;
    const genderRaw = input?.gender ?? onboarding?.gender ?? undefined;
    // translate common english gender tokens to Vietnamese for display
    const gender = (genderRaw === 'male' ? 'Nam' : genderRaw === 'female' ? 'Nữ' : genderRaw) as any;

    return { height, weight, age, gender };
  }, [rawMeasurements, rawResponse, onboarding]);

  // normalize measurement array into friendly keys (cm)
  const display = useMemo(() => {
    if (rawMeasurements && !Array.isArray(rawMeasurements)) return rawMeasurements;
    const arr: any[] = Array.isArray(rawMeasurements) ? rawMeasurements : rawResponse?.entry?.measurements ?? rawResponse?.measurements ?? [];
    const out: any = {};

    arr.forEach((m: any) => {
      const name = (m.name || m.key || '').toString().toLowerCase();
      const unit = (m.unit || '').toString().toLowerCase();
      const val = m.value ?? m.value_mm ?? m.value_cm ?? m.cm ?? m.mm ?? m.value_mm ?? m.value_cm ?? null;
      const num = val != null ? Number(val) : null;
      const asCm = num == null ? null : (unit === 'mm' ? mmToCm(num) : Math.round(num));

      if (!name) return;

      // PRIMARY friendly groups (prefer the first sensible match)
      if (name.includes('bust') || name.includes('chest') || name.includes('bustgirth')) {
        out.bust = out.bust ?? asCm;
      } else if (name.includes('waist') || name.includes('belly') || name.includes('bellywaist') || name.includes('waistgirth') || name.includes('waistheight')) {
        out.waist = out.waist ?? asCm;
      } else if (name.includes('hip') || name.includes('hipgirth') || name.includes('tophip') || name.includes('hipheight')) {
        out.hip = out.hip ?? asCm;
      } else if (name.includes('thigh') || name.includes('thighgirth') || name.includes('midthigh') || name.includes('midthigh')) {
        out.thigh = out.thigh ?? asCm;
      } else if (name.includes('calf') || name.includes('calfgirth')) {
        out.calf = out.calf ?? asCm;
      } else if (name.includes('forearm') || name.includes('forearmgirth') || (name.includes('wrist') || name.includes('wristgirth'))) {
        out.forearm = out.forearm ?? asCm;
      } else if (name.includes('knee')) {
        out.knee = out.knee ?? asCm;
      } else if (name.includes('neck') || name.includes('neckgirth') || name.includes('neckbase')) {
        out.neck = out.neck ?? asCm;
      } else if (name.includes('shoulder') || name.includes('acrossbackshoulder') || name.includes('acrossback')) {
        out.shoulder = out.shoulder ?? asCm;
      } else if (name.includes('upperarm') || name.includes('bicep') || (name.includes('arm') && !name.includes('forearm'))) {
        out.bicep = out.bicep ?? asCm;
      } else if (name.includes('height') || name.includes('stature') || name.includes('heightmm')) {
        out.height_est = out.height_est ?? (unit === 'mm' ? mmToCm(num) : Math.round(num as any));
      } else if (name.includes('weight') || name.includes('mass')) {
        out.weight_est = out.weight_est ?? (unit === 'g' ? gToKg(num) : Math.round(num as any));
      } else {
        // keep other numeric measurements under sanitized keys for debugging/inspection
        if (asCm != null) {
          const safeKey = name.replace(/[^a-z0-9]/g, '_');
          out[safeKey] = out[safeKey] ?? asCm;
        }
      }
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

  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  // modal popup state (used instead of Alert)
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'noti' | 'confirm' | 'toast'>('noti');
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);
  const [modalContent, setModalContent] = useState<string>('');
  const [modalConfirmHandler, setModalConfirmHandler] = useState<(() => void) | undefined>(undefined);
  const showModal = (opts: { title?: string; content: string; mode?: 'noti' | 'confirm' | 'toast'; onConfirm?: (() => void) }) => {
    setModalTitle(opts.title);
    setModalContent(opts.content);
    setModalMode(opts.mode ?? 'noti');
    setModalConfirmHandler(opts.onConfirm);
    setModalVisible(true);
  };
  const hideModal = () => setModalVisible(false);

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
        showModal({ title: 'Lưu thành công', content: 'Số đo đã được lưu vào hồ sơ.', mode: 'noti', onConfirm: () => { hideModal(); } });
      } else {
        showModal({ title: 'Không có số đo', content: 'Không tìm thấy số đo hợp lệ để lưu.', mode: 'noti' });
      }
    } catch (e) {
      console.log('Save measurements error', e);
      showModal({ title: 'Lỗi', content: 'Không thể lưu số đo.', mode: 'noti' });
    }
  };
  
  const handleSubmitAll = async () => {
    setToastVisible(false);
    setLoading(true);
    // show AI processing modal
    showModal({ title: 'Đang xử lý', content: 'AI đang xử lý dữ liệu, vui lòng chờ...', mode: 'noti' });
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
      } catch (err) {
        console.warn('Error building traineePayload for logging', err);
      }

      // ensure API payload includes the source/context (important for backend tracking)
      try {
        (bodyGramForApi as any).input = (bodyGramForApi as any).input ?? {};
        (bodyGramForApi as any).input.source = (bodyGramForApi as any).input.source ?? source;
      } catch (err) {
        console.warn('Could not annotate bodyGramForApi.input.source', err);
      }

      // 1) Create trainee profile (if any meaningful data)
      const tRes = await submitTraineeProfile(onboarding, bodyGramForApi);
      if (!tRes.ok) {
        const errMsg = typeof tRes.error === 'string' ? tRes.error : JSON.stringify(tRes.error);
        console.warn('submitTraineeProfile failed:', tRes.error);
        if (String(errMsg).toLowerCase().includes('validation') || String(errMsg).toLowerCase().includes('must')) {
          setLoading(false);
          setToastType('error');
          setToastMsg(`Lỗi khi tạo hồ sơ cá nhân: ${errMsg}`);
          setToastVisible(true);
          hideModal();
          showModal({ title: 'Lỗi', content: errMsg, mode: 'noti' });
          return;
        }
      }

      // 2) Submit personal injuries in background (best-effort)
      try {
        const injRes = await submitPersonalInjuries(onboarding);
        if (!injRes.ok) console.warn('submitPersonalInjuries returned error', injRes.error);
      } catch (err) {
        console.warn('submitPersonalInjuries thrown', err);
      }

      // 3) Submit health profile (required to navigate to assessment)
      const hRes = await submitHealthProfile(bodyGramForApi, source);
      setLoading(false);

      if (hRes.ok) {
        // save measurements locally as well
        await saveMeasurements();

        // persist per-user saved info so switching accounts won't reuse old data
        try {
          const me = await getProfile();
          if (me.ok) {
            const d: any = me.data;
            const userId = d?.id ?? d?.accountId ?? d?.memberId ?? null;
            if (userId) {
              const info: any = {
                profileId: hRes.data?.id ?? hRes.data?.profileId ?? undefined,
                 savedAt: Date.now(),
                 summary: { height: display.height_est, weight: display.weight_est },
               };
               await setBodySavedFor(userId, info);
             }
           }
         } catch (err) {
           console.warn('Could not persist per-user body saved info', err);
         }

        setToastType('success');
        setToastMsg('Lưu hồ sơ thành công');
        setToastVisible(true);
        hideModal();
        showModal({ title: 'Lưu hồ sơ thành công', content: 'Hồ sơ đã được lưu thành công.', mode: 'noti', onConfirm: () => { hideModal(); } });
        const profileId = hRes.data?.id ?? hRes.data?.profileId ?? hRes.data?.healthProfileId ?? null;
        setTimeout(() => {
          if (profileId) {
            try {
              (navigation as any).reset({ index: 0, routes: [{ name: 'HealthProfileAssessment', params: { healthProfileId: String(profileId) } }] });
            } catch {
              try { navigation.navigate('HealthProfileAssessment' as any, { healthProfileId: String(profileId) } as any); } catch { /* ignore */ }
            }
          } else {
            try { (navigation as any).reset({ index: 0, routes: [{ name: 'MainTabs' }] }); } catch { try { navigation.navigate('MainTabs' as any); } catch {} }
          }
        }, 700);
      } else {
        const msg = typeof hRes.error === 'string' ? hRes.error : JSON.stringify(hRes.error);
        console.warn('submitHealthProfile error', hRes.error);
        setToastType('error');
        setToastMsg(`Lỗi khi lưu: ${msg}`);
        setToastVisible(true);
        hideModal();
        showModal({ title: 'Lỗi', content: msg, mode: 'noti' });
      }
    } catch (e: any) {
      setLoading(false);
      const msg = e?.message ?? String(e);
      console.error('submitProfiles thrown error', e);
      setToastType('error');
      setToastMsg(`Lỗi khi lưu: ${msg}`);
      setToastVisible(true);
      hideModal();
      showModal({ title: 'Lỗi', content: msg, mode: 'noti' });
    }
  };
 console.log('Rendered ResultScreen with measurements:', saveMeasurements);
   return (
     <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1  p-4">
        {/* Header summary with back button (matches health card color) */}
        <View className="bg-amber-100 rounded-xl p-4 mb-4 flex-row items-center justify-between">
          <Pressable
            className="p-2"
            onPress={() => {
              try {
                if (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  // no back available — reset to main tabs
                  (navigation as any).reset({ index: 0, routes: [{ name: 'MainTabs' }] });
                }
              } catch (err) {
                try { (navigation as any).reset({ index: 0, routes: [{ name: 'MainTabs' }] }); } catch { /* noop */ }
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
          >
            <Text className="text-2xl text-gray-700">‹</Text>
          </Pressable>
          <Text className="text-center text-gray-700 flex-1 px-2">{`Chiều cao: ${summary.height ?? '-'}cm   Cân nặng: ${summary.weight ?? '-'}kg   ${summary.age ?? ''} tuổi   ${summary.gender ?? ''}`}</Text>
          <View className="w-8" />
        </View>

        {/* SILHOUETTE CARD */}
        <View className="bg-white rounded-xl p-4 items-center mb-4">
          <View className="w-64 h-80 items-center justify-center">

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
        <View className="mt-6">
          <TouchableOpacity
            onPress={handleSubmitAll}
            disabled={loading}
            style={[styles.saveBtn, loading ? styles.saveBtnDisabled : null]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Lưu kết quả</Text>
            )}
          </TouchableOpacity>
        </View>

        {loading ? <LoadingOverlay /> : null}
        <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />
        <ModalPopup
          {...({
            visible: modalVisible,
            mode: modalMode,
            onClose: () => setModalVisible(false),
            titleText: modalTitle,
            contentText: modalContent,
            confirmBtnText: 'Đóng',
            onConfirm: modalConfirmHandler,
          } as any)}
        />
      </ScrollView>
    </SafeAreaView>
    );
  }

const styles = StyleSheet.create({
  saveBtn: {
    backgroundColor: '#A0522D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginHorizontal: 2,
  },
  saveBtnDisabled: {
    backgroundColor: '#c4c4c4',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});


