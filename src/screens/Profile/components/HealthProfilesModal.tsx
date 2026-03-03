import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { fetchMyHealthProfiles } from '../../../services/profile';
import Ionicons from '@react-native-vector-icons/ionicons';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function HealthProfilesModal({ visible, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!visible) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchMyHealthProfiles();
        if (res.ok && mounted) {
          const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          setProfiles(data || []);
          setSelected((data && data.length > 0) ? data[0] : null);
        } else {
          setProfiles([]);
        }
      } catch (e) {
        setProfiles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [visible]);

  function renderSummary(p: any) {
    if (!p) return null;
    const h = p.heightCm ?? p.height ?? '-';
    const w = p.weightKg ?? p.weight ?? '-';
    const waist = p.waistCm ?? p.waist ?? '-';
    const hip = p.hipCm ?? p.hip ?? '-';
    const bmi = p.bmi ?? '-';

    return (
      <View className="bg-amber-50 rounded-lg p-4 mb-4">
        <Text className="font-semibold mb-2">Tóm tắt</Text>
        <Text>Chiều cao: {h} cm   Cân nặng: {w} kg</Text>
        <Text className="mt-1">Eo: {waist} cm   Hông: {hip} cm   BMI: {bmi}</Text>
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end">
        <View className="bg-white rounded-t-2xl p-4" style={{ maxHeight: '85%' }}>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold">Thông tin cơ thể</Text>
            <Pressable onPress={onClose}><Text className="text-amber-700">Đóng</Text></Pressable>
          </View>

          {loading ? <ActivityIndicator /> : (
            <ScrollView>
              {profiles.length === 0 ? (
                <View className="py-6">
                  <Text className="text-center text-gray-500">Không tìm thấy hồ sơ sức khỏe nào.</Text>
                </View>
              ) : (
                <View>
                  <View className="mb-3">
                    {profiles.map((p, idx) => (
                      <Pressable key={p.id ?? idx} onPress={() => setSelected(p)} className={`p-3 rounded-lg ${selected === p ? 'bg-amber-50' : 'bg-white'} mb-2 shadow`}> 
                        <View className="flex-row justify-between items-center">
                          <View>
                            <Text className="font-semibold">{p.name ?? `Hồ sơ ${idx+1}`}</Text>
                            <Text className="text-sm text-gray-500">{new Date(p.createdAt ?? p.created_at ?? Date.now()).toLocaleString()}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="#A0522D" />
                        </View>
                      </Pressable>
                    ))}
                  </View>

                  {renderSummary(selected)}

                  <View>
                    <Text className="font-semibold mb-2">Chi tiết số đo</Text>
                    <View className="flex-row flex-wrap -m-2">
                      {[
                        { key: 'bust', label: 'Ngực' },
                        { key: 'waistCm', label: 'Eo' },
                        { key: 'hipCm', label: 'Hông' },
                        { key: 'bicep', label: 'Bắp tay' },
                        { key: 'thigh', label: 'Đùi' },
                        { key: 'calf', label: 'Bắp chân' },
                      ].map((t) => (
                        <View key={t.key} className="w-1/2 p-2">
                          <View className="bg-background-sub2 rounded-xl p-4 shadow">
                            <Text className="text-sm text-gray-700">{t.label}</Text>
                            <Text className="text-2xl font-extrabold mt-2">{selected?.[t.key] ?? selected?.[t.key.replace(/Cm$/i, '')] ?? '-'}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View className="mt-4">
                    <Text className="text-sm text-gray-500">Metadata</Text>
                    <View className="bg-gray-50 rounded-md p-3 mt-2">
                      <Text className="text-xs text-gray-600">{selected?.metadata ?? JSON.stringify(selected ?? {}, null, 2)}</Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
