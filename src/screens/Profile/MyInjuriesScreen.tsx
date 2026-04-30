import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Modal,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { fetchMyInjuries, updatePersonalInjury } from '../../services/profile';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ModalPopup from '../../components/ModalPopup';

const COLORS = {
  bg: '#FFF9F3',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  primary: '#8B3F2D',
  accent: '#CD853F',
  border: '#F1E7DC',
  success: '#047857',
  successBg: '#ECFDF5',
  warning: '#C2410C',
  warningBg: '#FFEDD5',
  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
};

function getStatusInfo(status?: string | null) {
  const normalized = String(status ?? '').toUpperCase();

  switch (normalized) {
    case 'RECOVERED':
      return {
        label: 'Đã phục hồi',
        bg: COLORS.successBg,
        color: COLORS.success,
        icon: 'checkmark-circle-outline',
      };

    case 'ACTIVE':
      return {
        label: 'Đang chấn thương',
        bg: COLORS.warningBg,
        color: COLORS.warning,
        icon: 'alert-circle-outline',
      };

    default:
      return {
        label: status || 'Không rõ',
        bg: '#F1F5F9',
        color: COLORS.muted,
        icon: 'help-circle-outline',
      };
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa có ngày';

  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch {
    return 'Chưa có ngày';
  }
}

function EmptyInjuries({ onRefresh }: { onRefresh: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-24 h-24 rounded-full bg-[#FFF7ED] items-center justify-center mb-5">
        <Ionicons name="heart-circle-outline" size={50} color={COLORS.accent} />
      </View>

      <Text className="text-[#0F172A] text-xl font-black text-center">
        Không có chấn thương cá nhân
      </Text>

      <Text className="text-[#64748B] text-sm text-center mt-2 leading-5">
        Khi bạn thêm chấn thương, hệ thống có thể tư vấn bài tập phù hợp và an toàn hơn.
      </Text>

      <TouchableOpacity
        onPress={onRefresh}
        className="mt-6 px-5 py-3 rounded-2xl bg-[#8B3F2D] flex-row items-center"
      >
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text className="text-white font-black ml-2">Tải lại</Text>
      </TouchableOpacity>
    </View>
  );
}

function InjuryCard({
  item,
  onPress,
  onEdit,
}: {
  item: any;
  onPress: () => void;
  onEdit: () => void;
}) {
  const statusValue = item.status ?? item.injuryStatus ?? 'ACTIVE';
  const statusInfo = getStatusInfo(statusValue);

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-3xl p-4 mb-3 border border-[#F1E7DC] shadow-sm"
    >
      <View className="flex-row items-start">
        <View className="w-12 h-12 rounded-2xl bg-[#FFF7ED] items-center justify-center mr-3">
          <Ionicons name="bandage-outline" size={24} color={COLORS.primary} />
        </View>

        <View className="flex-1">
          <Text className="text-[#0F172A] text-base font-black" numberOfLines={1}>
            {item.injury?.name ?? item.injuryName ?? 'Chấn thương'}
          </Text>

          <View className="flex-row items-center mt-1">
            <Ionicons name="calendar-outline" size={13} color={COLORS.muted} />
            <Text className="text-[#64748B] text-xs ml-1 font-semibold">
              {formatDate(item.occurredAt)}
            </Text>
          </View>

          {item.notes ? (
            <View className="mt-3 bg-[#F8FAFC] rounded-2xl p-3">
              <Text className="text-[#334155] text-xs leading-5" numberOfLines={2}>
                {item.notes}
              </Text>
            </View>
          ) : (
            <View className="mt-3 bg-[#F8FAFC] rounded-2xl p-3">
              <Text className="text-[#94A3B8] text-xs font-semibold">
                Chưa có ghi chú
              </Text>
            </View>
          )}
        </View>

        <View className="items-end ml-2">
          <View
            className="px-2.5 py-1.5 rounded-full flex-row items-center"
            style={{ backgroundColor: statusInfo.bg }}
          >
            <Ionicons name={statusInfo.icon as any} size={13} color={statusInfo.color} />
            <Text
              className="text-[10px] font-black ml-1"
              style={{ color: statusInfo.color }}
            >
              {statusInfo.label}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onEdit}
            className="mt-3 px-3 py-2 rounded-xl bg-[#FFF7ED] border border-[#F1E7DC]"
          >
            <Text className="text-[#8B3F2D] font-black text-xs">Cập nhật</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
}

const MyInjuriesScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [injuries, setInjuries] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [modalState, setModalState] = useState<any>({ visible: false, title: '', message: '' });

  const navigation = useNavigation<any>();

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const res = await fetchMyInjuries();

      if (res.ok) {
        setInjuries(res.data ?? []);
      } else {
        setInjuries([]);
      }
    } catch (e) {
      console.warn('load injuries', e);
      setInjuries([]);
      setModalState({ visible: true, title: 'Lỗi', message: 'Không thể tải danh sách chấn thương' });
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await load(false);
    } finally {
      setRefreshing(false);
    }
  };

  const openEdit = (item: any) => {
    setSelected(item);
    setNotes(item.notes ?? '');
    setStatus(item.status ?? item.injuryStatus ?? 'ACTIVE');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelected(null);
    setNotes('');
    setStatus(undefined);
  };

  const showModal = (opts: { title?: string; message: string; onConfirm?: () => void }) => {
    setModalState({
      visible: true,
      title: opts.title ?? '',
      message: opts.message,
      onConfirm: () => {
        try { setModalState((s:any) => ({ ...s, visible: false })); } catch {}
        if (opts.onConfirm) opts.onConfirm();
      },
    });
  };

  const closePopup = () => setModalState((s:any) => ({ ...s, visible: false }));

  const saveEdit = async () => {
    if (!selected) return;

    setSaving(true);

    try {
      const personalInjuryId = selected.personalInjuryId ?? selected.id;

      const res = await updatePersonalInjury(personalInjuryId, {
        status,
        notes,
      });

      if (res.ok) {
        showModal({ title: 'Cập nhật', message: 'Đã lưu thay đổi' });
        closeModal();
        await load(false);
      } else {
        showModal({ title: 'Lỗi', message: res.error?.message || 'Không thể cập nhật' });
      }
    } catch (e) {
      console.warn('save injury', e);
      showModal({ title: 'Lỗi', message: 'Có lỗi khi lưu thay đổi' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFF9F3]">
      <View className="px-4 pt-2 pb-4 border-b border-[#F1E7DC]">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-[42px] h-[42px] rounded-full bg-white border border-[#F1E7DC] items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <View className="flex-1 mx-3">
            <Text className="text-[#0F172A] text-xl font-black">
              Chấn thương của tôi
            </Text>
            <Text className="text-[#64748B] text-xs mt-1 font-semibold">
              {injuries.length > 0
                ? `${injuries.length} chấn thương đã ghi nhận`
                : 'Theo dõi tình trạng tập luyện'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onRefresh}
            className="w-[42px] h-[42px] rounded-full bg-white border border-[#F1E7DC] items-center justify-center"
          >
            <Ionicons name="refresh" size={22} color="#8B3F2D" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color={COLORS.primary} />
          <Text className="mt-3 text-[#64748B] font-semibold">
            Đang tải chấn thương...
          </Text>
        </View>
      ) : (
        <FlatList
          data={injuries}
          keyExtractor={(item, index) => String(item.personalInjuryId ?? item.id ?? index)}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 32,
            flexGrow: injuries.length === 0 ? 1 : undefined,
          }}
          renderItem={({ item }) => (
            <InjuryCard
              item={item}
              onPress={() =>
                navigation.navigate('PersonalInjuryDetail', {
                  personalInjuryId: item.personalInjuryId ?? item.id,
                })
              }
              onEdit={() => openEdit(item)}
            />
          )}
          ListEmptyComponent={<EmptyInjuries onRefresh={onRefresh} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-[28px] p-5">
            <View className="flex-row items-center mb-4">
              <View className="w-11 h-11 rounded-2xl bg-[#FFF7ED] items-center justify-center mr-3">
                <Ionicons name="bandage-outline" size={24} color={COLORS.primary} />
              </View>

              <View className="flex-1">
                <Text className="text-[#0F172A] text-lg font-black">
                  Cập nhật chấn thương
                </Text>
                <Text className="text-[#64748B] text-xs mt-1">
                  Thay đổi trạng thái và ghi chú
                </Text>
              </View>

              <TouchableOpacity
                onPress={closeModal}
                className="w-9 h-9 rounded-full bg-[#F8FAFC] items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text className="text-[#64748B] text-sm font-bold mb-2">
              Trạng thái
            </Text>

            <View className="flex-row mb-4">
              <Pressable
                onPress={() => setStatus('ACTIVE')}
                className={`flex-1 mr-2 rounded-2xl p-3 border ${
                  status === 'ACTIVE'
                    ? 'bg-[#FFEDD5] border-[#FDBA74]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={status === 'ACTIVE' ? COLORS.warning : COLORS.muted}
                  />
                  <Text
                    className="ml-2 font-black text-xs"
                    style={{ color: status === 'ACTIVE' ? COLORS.warning : COLORS.muted }}
                  >
                    Đang chấn thương
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setStatus('RECOVERED')}
                className={`flex-1 ml-2 rounded-2xl p-3 border ${
                  status === 'RECOVERED'
                    ? 'bg-[#ECFDF5] border-[#86EFAC]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={status === 'RECOVERED' ? COLORS.success : COLORS.muted}
                  />
                  <Text
                    className="ml-2 font-black text-xs"
                    style={{ color: status === 'RECOVERED' ? COLORS.success : COLORS.muted }}
                  >
                    Đã phục hồi
                  </Text>
                </View>
              </Pressable>
            </View>

            <Text className="text-[#64748B] text-sm font-bold mb-2">
              Ghi chú
            </Text>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              className="border border-[#E2E8F0] rounded-2xl p-3 min-h-[110px] text-[#0F172A] bg-[#F8FAFC]"
              multiline
              textAlignVertical="top"
              placeholder="Nhập ghi chú tình trạng..."
            />

            <View className="flex-row justify-end mt-5">
              <TouchableOpacity
                onPress={closeModal}
                className="px-5 py-3 rounded-2xl bg-[#F1F5F9] mr-2"
              >
                <Text className="text-[#64748B] font-black">Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={saveEdit}
                className="px-5 py-3 rounded-2xl bg-[#8B3F2D]"
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-black">Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ModalPopup
        {...(modalState as any)}
        titleText={modalState.title}
        contentText={modalState.message}
        onClose={closePopup}
      />
    </SafeAreaView>
  );
};

export default MyInjuriesScreen;