import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
  TextInput,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import BalanceCard from './components/BalanceCard';
import ActionButtons from './components/ActionButtons.tsx';
import TransactionChart from './components/TransactionChart';
import TransactionItem from './components/TransactionItem';
import {
  getMyTransactions,
  getTransactionsByType,
} from '../../services/transaction';
import {
  fetchMyWallet,
  getMyWithdrawals,
  getMyWithdrawalById,
  cancelMyWithdrawal,
} from '../../services/wallet';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ModalPopup from '../../components/ModalPopup';
import { SafeAreaView } from 'react-native-safe-area-context';

type Transaction = {
  transactionId: string;
  transactionType: string;
  amount: number;
  transactionDate: string;
  description?: string;
};

const TRANSACTION_TYPES: string[] = [
  'WALLET_TOP_UP',
  'WALLET_WITHDRAWAL',
  'ORDER',
  'SUBSCRIPTION_PACKAGE',
  'SUBSCRIPTION_PRORATION_REFUND',
  'SUBSCRIPTION_UPGRADE',
  'REFUND',
  'COURSE',
  'PENALTY',
  'BOOKING_COACH',
  'BOOKING_COACH_REFUND',
];

const TYPE_LABELS: Record<string, string> = {
  WALLET_TOP_UP: 'Nạp ví',
  WALLET_WITHDRAWAL: 'Rút ví',
  ORDER: 'Đơn hàng',
  SUBSCRIPTION_PACKAGE: 'Gói đăng ký',
  SUBSCRIPTION_PRORATION_REFUND: 'Hoàn tiền đăng ký',
  SUBSCRIPTION_UPGRADE: 'Nâng cấp đăng ký',
  REFUND: 'Hoàn tiền',
  COURSE: 'Khóa học',
  PENALTY: 'Phạt',
  BOOKING_COACH: 'Đặt huấn luyện',
  BOOKING_COACH_REFUND: 'Hoàn tiền đặt huấn luyện',
};

const creditTypes = [
  'WALLET_TOP_UP',
  'REFUND',
  'SUBSCRIPTION_PRORATION_REFUND',
  'BOOKING_COACH_REFUND',
];

function formatVND(value: any) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))}₫`;
}

function translateStatus(status?: string | null) {
  switch ((status || '').toUpperCase()) {
    case 'PENDING':
      return 'Đang xử lý';
    case 'COMPLETED':
      return 'Hoàn thành';
    case 'CANCELLED':
      return 'Đã hủy';
    case 'REJECTED':
      return 'Bị từ chối';
    case 'APPROVED':
      return 'Đã duyệt';
    case 'FAILED':
      return 'Thất bại';
    default:
      return status || '';
  }
}

function getStatusClass(status?: string | null) {
  switch ((status || '').toUpperCase()) {
    case 'PENDING':
      return {
        wrap: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: 'time-outline',
      };
    case 'COMPLETED':
      return {
        wrap: 'bg-green-100',
        text: 'text-green-700',
        icon: 'checkmark-circle-outline',
      };
    case 'CANCELLED':
      return {
        wrap: 'bg-gray-100',
        text: 'text-gray-600',
        icon: 'close-circle-outline',
      };
    case 'REJECTED':
    case 'FAILED':
      return {
        wrap: 'bg-red-100',
        text: 'text-red-700',
        icon: 'alert-circle-outline',
      };
    default:
      return {
        wrap: 'bg-gray-100',
        text: 'text-gray-600',
        icon: 'information-circle-outline',
      };
  }
}

const WithdrawalsSeparator = () => <View className="h-3" />;

export default function WalletScreen() {
  const navigation = useNavigation<any>();

  const [balance, setBalance] = useState<number>(0);
  const [wallet, setWallet] = useState<any | null>(null);
  const [walletLoading, setWalletLoading] = useState<boolean>(true);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [withdrawalsModalVisible, setWithdrawalsModalVisible] = useState(false);

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [modalProps, setModalProps] = useState<any>({ visible: false });

  function showModal(
    title: string,
    message?: string,
    mode: string = 'noti',
    onConfirm?: () => void,
  ) {
    const normalizedMode = mode === 'notify' ? 'noti' : mode;

    setModalProps({
      visible: true,
      mode: normalizedMode,
      titleText: title,
      contentText: message ?? '',
      onClose: () => setModalProps({ visible: false }),
      ...(onConfirm ? { onConfirm } : {}),
      ...(normalizedMode === 'confirm'
        ? { onCancel: () => setModalProps({ visible: false }) }
        : {}),
    });
  }

  const loadWithdrawals = useCallback(async () => {
    setWithdrawalsLoading(true);

    try {
      const res = await getMyWithdrawals();
      if (res.ok) setWithdrawals(res.data ?? []);
    } catch (e) {
      console.warn('load withdrawals err', e);
    } finally {
      setWithdrawalsLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getMyTransactions();
      setTransactions(data || []);
      setFiltered(data || []);
    } catch (err) {
      console.warn('load tx err', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWallet = useCallback(async () => {
    setWalletLoading(true);

    try {
      const res = await fetchMyWallet();

      if (res.ok) {
        const w = res.data ?? res;
        setWallet(w);

        const walletBalance = w?.balanceVND ?? w?.balance ?? null;
        if (typeof walletBalance === 'number') {
          setBalance(walletBalance);
        }
      } else {
        setWallet(null);
      }
    } catch (e) {
      console.warn('load wallet err', e);
      setWallet(null);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const fetchByType = useCallback(
    async (type: string) => {
      setLoading(true);

      try {
        const data = await getTransactionsByType(type);
        setFiltered(data || []);
      } catch (err) {
        console.warn('fetch by type err', err);
        setFiltered(transactions.filter(t => t.transactionType === type));
      } finally {
        setLoading(false);
      }
    },
    [transactions],
  );

  const refreshAll = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([loadWallet(), loadTransactions(), loadWithdrawals()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadWallet, loadTransactions, loadWithdrawals]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useFocusEffect(
    useCallback(() => {
      refreshAll();
      return () => { };
    }, [refreshAll]),
  );

  useEffect(() => {
    if (!selectedType) {
      setFiltered(transactions);
      return;
    }

    fetchByType(selectedType).catch(() => { });
  }, [selectedType, transactions, fetchByType]);

  function onTransactionPress(tx: Transaction) {
    navigation.navigate('TransactionDetail', {
      transactionId: tx.transactionId,
    });
  }

  async function openWithdrawalDetail(withdrawalId: string) {
    setDetailLoading(true);

    try {
      const res = await getMyWithdrawalById(withdrawalId);

      if (!res.ok) {
        showModal('Lỗi', res.error?.message ?? 'Không thể tải chi tiết');
        return;
      }

      setSelectedWithdrawal(res.data);
      setDetailModalVisible(true);
    } catch (e) {
      console.warn('open withdrawal detail', e);
      showModal('Lỗi', 'Không thể tải chi tiết yêu cầu');
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCancelSelected() {
    if (!selectedWithdrawal) return;

    showModal(
      'Hủy yêu cầu',
      'Bạn có chắc muốn hủy yêu cầu rút tiền này?',
      'confirm',
      async () => {
        setDetailLoading(true);

        try {
          const res = await cancelMyWithdrawal(
            selectedWithdrawal.walletWithdrawalId,
          );

          if (!res.ok) {
            showModal('Lỗi', res.error?.message ?? 'Không thể hủy');
            return;
          }

          showModal('Đã hủy', 'Yêu cầu đã được hủy');
          await loadWithdrawals();
          setDetailModalVisible(false);
          setSelectedWithdrawal(null);
        } catch (e) {
          console.warn('cancel err', e);
          showModal('Lỗi', 'Có lỗi xảy ra');
        } finally {
          setDetailLoading(false);
        }
      },
    );
  }

  const filterItems = React.useMemo(
    () => [
      { key: 'ALL', label: 'Tất cả', value: null },
      ...TRANSACTION_TYPES.map(type => ({
        key: type,
        label: TYPE_LABELS[type] ?? type,
        value: type,
      })),
    ],
    [],
  );

  const transactionData = React.useMemo(() => {
    return filtered.map(item => {
      const isDeposit = creditTypes.includes(item.transactionType);

      return {
        id: item.transactionId,
        title: TYPE_LABELS[item.transactionType] ?? item.transactionType,
        amount: Math.abs(Number(item.amount || 0)),
        date: item.transactionDate?.slice(0, 10),
        type: (isDeposit ? 'deposit' : 'withdraw') as 'deposit' | 'withdraw',
        raw: item,
      };
    });
  }, [filtered]);

  const renderEmpty = useCallback(
    () => (
      <View className="items-center px-6 py-12">
        <View className="w-20 h-20 rounded-full bg-[#FFF7ED] items-center justify-center mb-4">
          <Ionicons name="receipt-outline" size={36} color="#CD853F" />
        </View>

        <Text className="text-[#0F172A] text-lg font-black">
          Chưa có giao dịch
        </Text>

        <Text className="text-[#64748B] text-sm text-center mt-2 leading-5">
          Bạn chưa có giao dịch nào trong bộ lọc hiện tại.
        </Text>

        <TouchableOpacity
          onPress={loadTransactions}
          className="mt-5 px-5 py-3 rounded-2xl bg-[#8B3F2D]"
        >
          <Text className="text-white font-extrabold">Tải lại</Text>
        </TouchableOpacity>
      </View>
    ),
    [loadTransactions],
  );

  const renderHeader = useCallback(
    () => (
      <View className="px-4 pt-4">
        <BalanceCard balance={balance} />

        {walletLoading ? (
          <View className="mt-3 bg-white rounded-2xl p-4 border border-[#F1E7DC]">
            <ActivityIndicator color="#8B3F2D" />
          </View>
        ) : wallet ? (
          <View className="mt-3 bg-white rounded-2xl p-4 border border-[#F1E7DC] shadow-sm">
            <View className="flex-row justify-between">
              <View className="flex-1 mr-2 bg-[#ECFDF5] rounded-2xl p-3">
                <Text className="text-[#047857] text-xs font-bold">
                  Khả dụng
                </Text>
                <Text className="text-[#047857] font-black mt-1">
                  {formatVND(wallet.availableVND ?? wallet.available ?? 0)}
                </Text>
              </View>

              <View className="flex-1 ml-2 bg-[#FFF7ED] rounded-2xl p-3">
                <Text className="text-[#C2410C] text-xs font-bold">
                  Đang khóa
                </Text>
                <Text className="text-[#C2410C] font-black mt-1">
                  {formatVND(wallet.lockedVND ?? wallet.locked ?? 0)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View className="mt-4">
          <ActionButtons
            onDeposit={() => navigation.navigate('Deposit')}
            onWithdraw={() => navigation.navigate('Withdraw')}
            onOpenWithdrawals={() => setWithdrawalsModalVisible(true)}
            withdrawalsCount={withdrawals.length}
          />
        </View>

        <View className="mt-5 flex-row items-center justify-between">
          <View>
            <Text className="text-[#0F172A] text-xl font-black">
              Giao dịch
            </Text>
            <Text className="text-[#64748B] text-xs mt-1">
              Theo dõi lịch sử ví của bạn
            </Text>
          </View>

          <TouchableOpacity
            onPress={refreshAll}
            className="w-10 h-10 rounded-full bg-white border border-[#F1E7DC] items-center justify-center"
          >
            <Ionicons name="refresh" size={20} color="#8B3F2D" />
          </TouchableOpacity>
        </View>

        <View className="my-4">
          <FlatList
            horizontal
            data={filterItems}
            keyExtractor={item => item.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
            renderItem={({ item }) => {
              const active =
                selectedType === item.value ||
                (!selectedType && item.value === null);

              return (
                <TouchableHighlight
                  underlayColor="#F1E7DC"
                  className={`py-2.5 px-4 rounded-full mr-2 border ${active
                    ? 'bg-[#8B3F2D] border-[#8B3F2D]'
                    : 'bg-white border-[#F1E7DC]'
                    }`}
                  onPress={() =>
                    setSelectedType(selectedType === item.value ? null : item.value)
                  }
                >
                  <Text
                    numberOfLines={1}
                    className={`font-extrabold text-xs whitespace-nowrap flex-shrink-0 ${active ? 'text-white' : 'text-[#64748B]'
                      }`}
                  >
                    {item.label}
                  </Text>
                </TouchableHighlight>
              );
            }}
          />
        </View>

        <View className="bg-white rounded-2xl border border-[#F1E7DC] overflow-hidden mb-4">
          <TransactionChart transactions={transactions} typeLabels={TYPE_LABELS} />
        </View>

        {loading ? (
          <View className="py-6 items-center">
            <ActivityIndicator color="#8B3F2D" />
            <Text className="text-[#64748B] text-xs mt-2">
              Đang tải giao dịch...
            </Text>
          </View>
        ) : null}
      </View>
    ),
    [
      balance,
      wallet,
      walletLoading,
      withdrawals.length,
      selectedType,
      filterItems,
      transactions,
      navigation,
      refreshAll,
      loading,
    ],
  );

  const renderWithdrawalItem = ({ item }: { item: any }) => {
    const statusClass = getStatusClass(item.status);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        className="bg-white rounded-2xl p-4 border border-[#F1E7DC] flex-row items-center"
        onPress={() => openWithdrawalDetail(item.walletWithdrawalId)}
      >
        {item.bankLogo ? (
          <Image source={{ uri: item.bankLogo }} style={styles.bankLogoSmall} />
        ) : (
          <View className="w-12 h-12 bg-[#F8FAFC] rounded-xl mr-3 items-center justify-center">
            <Ionicons name="business-outline" size={22} color="#94A3B8" />
          </View>
        )}

        <View className="flex-1">
          <Text className="font-black text-[#0F172A]" numberOfLines={1}>
            {item.bankName}
          </Text>

          <Text className="text-sm text-[#64748B] mt-1" numberOfLines={1}>
            {item.recipientName} • {item.bankAccountNumber}
          </Text>

          <Text className="text-[#8B3F2D] font-black mt-2">
            {formatVND(item.amount)}
          </Text>
        </View>

        <View className="items-end ml-2">
          <View className={`min-w-[80px] self-start items-center justify-center px-2.5 py-1 rounded-full ${statusClass.wrap}`}>
            <Text className={`${statusClass.text} text-center text-xs font-extrabold`}>
              {translateStatus(item.status)}
            </Text>
          </View>

          <Text className="text-xs text-[#94A3B8] mt-2">
            {item.requestedAt ? new Date(item.requestedAt).toLocaleDateString('vi-VN') : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFF9F3]">
      <View className="px-4 pt-2 pb-4 border-b border-[#F1E7DC]">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'MainTabs',
                    params: { screen: 'TraineeProfile' },
                  },
                ],
              })
            }
            className="w-[42px] h-[42px] rounded-full bg-white border border-[#F1E7DC] items-center justify-center"
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <View className="flex-1 mx-3">
            <Text className="text-[#0F172A] text-xl font-black">Ví của tôi</Text>
            <Text className="text-[#64748B] text-xs mt-1">
              Quản lý số dư và giao dịch
            </Text>
          </View>

          <TouchableOpacity
            onPress={refreshAll}
            className="w-[42px] h-[42px] rounded-full bg-white border border-[#F1E7DC] items-center justify-center"
          >
            <Ionicons name="refresh" size={22} color="#8B3F2D" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={transactionData}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            tx={{ ...item, type: item.type }}
            onPress={() => onTransactionPress(item.raw)}
          />
        )}
        ListEmptyComponent={!loading ? renderEmpty : null}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} />
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={withdrawalsModalVisible}
        animationType="slide"
        onRequestClose={() => setWithdrawalsModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-[#FFF9F3]">
          <View className="px-4 pt-2 pb-4 border-b border-[#F1E7DC]">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setWithdrawalsModalVisible(false)}
                className="w-[42px] h-[42px] rounded-full bg-white border border-[#F1E7DC] items-center justify-center"
              >
                <Ionicons name="arrow-back" size={22} color="#0F172A" />
              </TouchableOpacity>

              <View className="flex-1 mx-3">
                <Text className="text-[#0F172A] text-xl font-black">
                  Yêu cầu rút tiền
                </Text>
                <Text className="text-[#64748B] text-xs mt-1">
                  {withdrawals.length} yêu cầu đã tạo
                </Text>
              </View>

              <TouchableOpacity
                onPress={loadWithdrawals}
                className="w-[42px] h-[42px] rounded-full bg-white border border-[#F1E7DC] items-center justify-center"
              >
                <Ionicons name="refresh" size={22} color="#8B3F2D" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="px-4 py-3">
            <View className="bg-white border border-[#F1E7DC] rounded-2xl px-4 flex-row items-center">
              <Ionicons name="search-outline" size={18} color="#94A3B8" />
              <TextInput
                value=""
                onChangeText={() => { }}
                placeholder="Tìm kiếm..."
                className="flex-1 py-3 ml-2 text-[#0F172A]"
              />
            </View>
          </View>

          {withdrawalsLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#8B3F2D" />
              <Text className="text-[#64748B] mt-2">
                Đang tải yêu cầu rút tiền...
              </Text>
            </View>
          ) : (
            <FlatList
              data={withdrawals}
              keyExtractor={item => item.walletWithdrawalId}
              ItemSeparatorComponent={WithdrawalsSeparator}
              contentContainerStyle={styles.withdrawalsContent}
              renderItem={renderWithdrawalItem}
              ListEmptyComponent={
                <View className="items-center py-20 px-8">
                  <Ionicons name="cash-outline" size={48} color="#CD853F" />
                  <Text className="text-[#0F172A] font-black text-lg mt-3">
                    Chưa có yêu cầu rút tiền
                  </Text>
                  <Text className="text-[#64748B] text-center mt-2">
                    Khi bạn tạo yêu cầu rút tiền, danh sách sẽ hiển thị tại đây.
                  </Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={detailModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setDetailModalVisible(false);
          setSelectedWithdrawal(null);
        }}
      >
        <SafeAreaView className="flex-1 bg-[#FFF9F3]">
          <View className="px-4 pt-2 pb-4 border-b border-[#F1E7DC]">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  setDetailModalVisible(false);
                  setSelectedWithdrawal(null);
                }}
                className="w-[42px] h-[42px] rounded-full bg-white border border-[#F1E7DC] items-center justify-center"
              >
                <Ionicons name="arrow-back" size={22} color="#0F172A" />
              </TouchableOpacity>

              <View className="flex-1 mx-3">
                <Text className="text-[#0F172A] text-xl font-black">
                  Chi tiết yêu cầu
                </Text>
                <Text className="text-[#64748B] text-xs mt-1">
                  Thông tin rút tiền
                </Text>
              </View>

              <View className="w-[42px]" />
            </View>
          </View>

          {detailLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#8B3F2D" />
            </View>
          ) : selectedWithdrawal ? (
            <View className="p-4">
              <View className="bg-white rounded-3xl p-5 border border-[#F1E7DC] shadow-sm">
                <View className="flex-row items-center mb-5">
                  {selectedWithdrawal.bankLogo ? (
                    <Image
                      source={{ uri: selectedWithdrawal.bankLogo }}
                      style={styles.bankLogoLarge}
                    />
                  ) : (
                    <View className="w-16 h-16 bg-[#F8FAFC] rounded-2xl mr-3 items-center justify-center">
                      <Ionicons name="business-outline" size={28} color="#94A3B8" />
                    </View>
                  )}

                  <View className="flex-1">
                    <Text className="font-black text-lg text-[#0F172A]">
                      {selectedWithdrawal.bankName}
                    </Text>
                    <Text className="text-sm text-[#64748B] mt-1">
                      {selectedWithdrawal.bankAccountNumber}
                    </Text>
                  </View>
                </View>

                <View className="bg-[#FFF7ED] rounded-2xl p-4 mb-4">
                  <Text className="text-[#64748B] text-xs font-bold">
                    Số tiền rút
                  </Text>
                  <Text className="text-[#8B3F2D] text-2xl font-black mt-1">
                    {formatVND(selectedWithdrawal.amount)}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-sm text-[#64748B] font-bold">
                    Người nhận
                  </Text>
                  <Text className="font-black text-[#0F172A] mt-1">
                    {selectedWithdrawal.recipientName}
                  </Text>
                </View>

                <View className="mb-4">
                  <Text className="text-sm text-[#64748B] font-bold">
                    Ghi chú
                  </Text>
                  <Text className="text-[#334155] mt-1">
                    {selectedWithdrawal.note ?? '—'}
                  </Text>
                </View>

                <View className="mb-5">
                  <Text className="text-sm text-[#64748B] font-bold">
                    Trạng thái
                  </Text>

                  <Text className="font-black text-[#0F172A] mt-1">
                    {translateStatus(selectedWithdrawal.status)}
                  </Text>

                  <Text className="text-xs text-[#94A3B8] mt-2">
                    Yêu cầu lúc:{' '}
                    {selectedWithdrawal.requestedAt
                      ? new Date(selectedWithdrawal.requestedAt).toLocaleString('vi-VN')
                      : '—'}
                  </Text>

                  <Image className='mx-auto' source={{ uri: selectedWithdrawal.receiptUrl }} style={{ width: 300, height: 300, zIndex: 99}} />
                </View>

                <TouchableOpacity
                  disabled={selectedWithdrawal.status !== 'PENDING' || detailLoading}
                  onPress={handleCancelSelected}
                  className={`py-4 rounded-2xl items-center ${selectedWithdrawal.status === 'PENDING'
                    ? 'bg-red-600'
                    : 'bg-gray-300'
                    }`}
                >
                  <Text className="text-white font-black">Hủy yêu cầu</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>

      <ModalPopup {...(modalProps as any)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 32,
  },
  withdrawalsContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  filterContainer: {
    paddingRight: 16,
    alignItems: 'center',
  },
  bankLogoSmall: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  bankLogoLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginRight: 12,
  },
});