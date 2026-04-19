import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { fetchMyInjuries, updatePersonalInjury } from '../../services/profile';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const statusColor = (s?: string | null) => {
  const st = (s || '').toUpperCase();
  if (st === 'RECOVERED') return '#10B981'; // green
  if (st === 'ACTIVE') return '#F59E0B'; // amber
  return '#6B7280';
};

const MyInjuriesScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [injuries, setInjuries] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation<any>();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchMyInjuries();
      if (res.ok) setInjuries(res.data ?? []);
      else setInjuries([]);
    } catch (e) {
      console.warn('load injuries', e);
      setInjuries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (item: any) => {
    setSelected(item);
    setNotes(item.notes ?? '');
    setStatus(item.status ?? item.injuryStatus ?? 'ACTIVE');
    setModalVisible(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await updatePersonalInjury(selected.personalInjuryId ?? selected.id, { status, notes });
      if (res.ok) {
        Alert.alert('Cập nhật', 'Đã lưu thay đổi');
        setModalVisible(false);
        await load();
      } else {
        Alert.alert('Lỗi', res.error?.message || 'Không thể cập nhật');
      }
    } catch (e) {
      console.warn('save injury', e);
      Alert.alert('Lỗi', 'Có lỗi khi lưu thay đổi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <SafeAreaView className="flex-1 justify-center items-center bg-slate-50">
      <ActivityIndicator />
    </SafeAreaView>
  );

  if (!injuries || injuries.length === 0) return (
    <SafeAreaView className="flex-1 bg-[#FFFAF0]">
      <View className="p-6">
        <View className="bg-white rounded-xl p-6 items-center shadow">
          <Text className="text-lg font-bold text-slate-900">Không có chấn thương cá nhân</Text>
          <Text className="text-slate-500 mt-2 text-center">Bạn có thể thêm chấn thương nếu cần tư vấn tập luyện phù hợp.</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FFFAF0]">
      {/* Header with back button */}
      <View className="flex-row items-center px-4 py-3 bg-white shadow">
  <View className="w-10 items-start">
    <Pressable onPress={() => navigation.goBack()} className="p-2">
      <Text className="text-lg">←</Text>
    </Pressable>
  </View>

  <View className="flex-1 items-center">
    <Text className="text-lg font-bold">Chấn thương của tôi</Text>
  </View>

  <View className="w-10" />
</View>

      <View className="p-4">
        <FlatList
          data={injuries}
          keyExtractor={(i) => String(i.personalInjuryId ?? i.id)}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable className="bg-white rounded-xl p-4 mb-3 shadow" onPress={() => navigation.navigate('PersonalInjuryDetail', { personalInjuryId: item.personalInjuryId ?? item.id })}>
              <View className="flex-row items-start">
                <View className="flex-1">
                  <Text className="text-slate-900 text-base font-bold">{item.injury?.name ?? item.injuryName ?? 'Chấn thương'}</Text>
                  <Text className="text-slate-500 text-xs mt-1">{item.occurredAt ? new Date(item.occurredAt).toLocaleDateString('vi-VN') : ''}</Text>
                  {item.notes ? <Text numberOfLines={2} className="text-slate-700 mt-2">{item.notes}</Text> : null}
                </View>

                <View className="items-end ml-3">
                  <View className="rounded-full px-3 py-1" style={{ backgroundColor: statusColor(item.status ?? item.injuryStatus) }}>
                    <Text className="text-white font-bold">{(item.status ?? item.injuryStatus ?? 'ACTIVE').toString()}</Text>
                  </View>

                  <Pressable onPress={() => openEdit(item)} className="mt-3 bg-amber-100 px-3 py-1 rounded-md">
                    <Text className="text-amber-800 font-semibold">Cập nhật</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,6,23,0.5)', justifyContent: 'center', padding: 20 }}>
          <View className="bg-white rounded-xl p-4">
            <Text className="text-base font-extrabold mb-3">Cập nhật chấn thương</Text>

            <Text className="text-slate-500 mt-2">Trạng thái</Text>
            <View className="flex-row mt-2">
              <Pressable onPress={() => setStatus('ACTIVE')} className={`px-3 py-2 rounded-md mr-2 ${status === 'ACTIVE' ? 'border border-amber-400 bg-amber-100' : 'bg-slate-100'}`}>
                <Text>Đang chấn thương</Text>
              </Pressable>
              <Pressable onPress={() => setStatus('RECOVERED')} className={`px-3 py-2 rounded-md ${status === 'RECOVERED' ? 'border border-emerald-400 bg-emerald-100' : 'bg-slate-100'}`}>
                <Text>Đã phục hồi</Text>
              </Pressable>
            </View>

            <Text className="text-slate-500 mt-4">Ghi chú</Text>
            <TextInput value={notes} onChangeText={setNotes} className="border border-gray-200 rounded-md p-2 mt-2" multiline numberOfLines={4} />

            <View className="flex-row justify-end mt-4">
              <Pressable onPress={() => setModalVisible(false)} className="px-3 py-2 rounded-md mr-2">
                <Text className="text-slate-600">Hủy</Text>
              </Pressable>
              <Pressable onPress={saveEdit} className="px-3 py-2 rounded-md bg-amber-700" disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Lưu</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MyInjuriesScreen;
