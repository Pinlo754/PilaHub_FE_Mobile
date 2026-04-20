import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TouchableHighlight, ActivityIndicator, Modal, FlatList, Alert, Image, TextInput, StyleSheet } from 'react-native';
import BalanceCard from './components/BalanceCard';
import ActionButtons from './components/ActionButtons.tsx';
import TransactionChart from './components/TransactionChart';
import TransactionItem from './components/TransactionItem';
import { getMyTransactions, getTransactionsByType } from '../../services/transaction';
import { fetchMyWallet, getMyWithdrawals, getMyWithdrawalById, updateMyWithdrawal, cancelMyWithdrawal } from '../../services/wallet';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

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
    SUBSCRIPTION_PACKAGE: 'Gói đăng ký',
    SUBSCRIPTION_PRORATION_REFUND: 'Hoàn tiền đăng ký',
    SUBSCRIPTION_UPGRADE: 'Nâng cấp đăng ký',
    REFUND: 'Hoàn tiền',
    COURSE: 'Khóa học',
    PENALTY: 'Phạt',
    BOOKING_COACH: 'Đặt huấn luyện',
    BOOKING_COACH_REFUND: 'Hoàn tiền đặt huấn luyện',
};

// small stylesheet for list padding and logos
const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  filterContainer: { paddingHorizontal: 8, alignItems: 'center' },
  sep: { height: 12 },
  bankLogoSmall: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  bankLogoLarge: { width: 64, height: 64, borderRadius: 8, marginRight: 12 },
  flex1: { flex: 1 },
});

const WithdrawalsSeparator = () => <View style={styles.sep} />;

export default function WalletScreen() {
    const navigation = useNavigation<any>();
    const [balance, setBalance] = useState<number>(0);
    const [wallet, setWallet] = useState<any | null>(null);
    const [walletLoading, setWalletLoading] = useState<boolean>(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filtered, setFiltered] = useState<Transaction[]>([]);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [_loading, setLoading] = useState(false);

    // withdrawals minimal state
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
    const [withdrawalsModalVisible, setWithdrawalsModalVisible] = useState(false);

    // detail / edit state
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editAmount, setEditAmount] = useState('');
    const [editNote, setEditNote] = useState('');

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
            setTransactions(data);
            setFiltered(data);

            // Do not compute balance from transactions here. Balance is provided by wallet API.
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
                const wbal = (w?.balanceVND ?? w?.balance ?? null);
                if (typeof wbal === 'number') setBalance(wbal);
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

    const fetchByType = useCallback(async (type: string) => {
        setLoading(true);
        try {
            const data = await getTransactionsByType(type);
            setFiltered(data);
        } catch (err) {
            console.warn('fetch by type err', err);
            setFiltered(transactions.filter(t => t.transactionType === type));
        } finally {
            setLoading(false);
        }
    }, [transactions]);

    useEffect(() => {
        loadTransactions();
        loadWallet();
        loadWithdrawals();
    }, [loadTransactions, loadWallet, loadWithdrawals]);

    // Refresh when screen is focused (e.g., returning from payment flow)
    useFocusEffect(
        useCallback(() => {
            loadWallet();
            loadTransactions();
            loadWithdrawals();
            return () => { /* no cleanup */ };
        }, [loadWallet, loadTransactions, loadWithdrawals])
    );

    useEffect(() => {
        if (!selectedType) {
            setFiltered(transactions);
            return;
        }

        // call by-type helper
        fetchByType(selectedType).catch(() => { });
    }, [selectedType, transactions, fetchByType]);

    function onTransactionPress(tx: Transaction) {
        navigation.navigate('TransactionDetail', { transactionId: tx.transactionId });
    }

    function formatNumberInput(value: string) {
        const cleaned = (value || '').toString().replace(/[^0-9]/g, '');
        if (!cleaned) return '';
        try { return Number(cleaned).toLocaleString('vi-VN'); } catch { return cleaned; }
    }

    async function openWithdrawalDetail(withdrawalId: string) {
        setDetailLoading(true);
        try {
            const res = await getMyWithdrawalById(withdrawalId);
            if (!res.ok) { Alert.alert('Lỗi', res.error?.message ?? 'Không thể tải chi tiết'); return; }
            const d = res.data;
            setSelectedWithdrawal(d);
            setEditAmount(Number(d.amount || 0).toLocaleString('vi-VN'));
            setEditNote(d.note ?? '');
            setDetailModalVisible(true);
        } catch (e) { console.warn('open withdrawal detail', e); }
        finally { setDetailLoading(false); }
    }

    async function handleUpdateSelected() {
        if (!selectedWithdrawal) return;
        const cleaned = Number((editAmount || '').toString().replace(/[^0-9]/g, '')) || 0;
        if (cleaned <= 0) { Alert.alert('Lỗi', 'Số tiền không hợp lệ'); return; }
        setDetailLoading(true);
        try {
            const res = await updateMyWithdrawal(selectedWithdrawal.walletWithdrawalId, { amount: cleaned, note: editNote });
            if (!res.ok) { Alert.alert('Lỗi', res.error?.message ?? 'Không thể cập nhật'); return; }
            Alert.alert('Thành công', 'Yêu cầu đã được cập nhật');
            await loadWithdrawals();
            setSelectedWithdrawal(res.data);
        } catch (e) { console.warn('update selected err', e); Alert.alert('Lỗi', 'Có lỗi xảy ra'); }
        finally { setDetailLoading(false); }
    }

    async function handleCancelSelected() {
        if (!selectedWithdrawal) return;
        Alert.alert('Hủy yêu cầu', 'Bạn có chắc muốn hủy yêu cầu này?', [
            { text: 'Không', style: 'cancel' },
            { text: 'Có', onPress: async () => {
                setDetailLoading(true);
                try {
                    const res = await cancelMyWithdrawal(selectedWithdrawal.walletWithdrawalId);
                    if (!res.ok) { Alert.alert('Lỗi', res.error?.message ?? 'Không thể hủy'); return; }
                    Alert.alert('Đã hủy', 'Yêu cầu đã được hủy');
                    await loadWithdrawals();
                    setDetailModalVisible(false);
                    setSelectedWithdrawal(null);
                } catch (e) { console.warn('cancel err', e); Alert.alert('Lỗi', 'Có lỗi xảy ra'); }
                finally { setDetailLoading(false); }
            } }
        ]);
    }

    const filterItems = React.useMemo(() => [{ key: 'ALL', label: 'Tất cả', value: null }, ...TRANSACTION_TYPES.map(t => ({ key: t, label: TYPE_LABELS[t] ?? t, value: t }))], []);

    const renderEmpty = useCallback(() => (
        <View className="p-3 bg-gray-50 rounded mt-3">
            <Text className="text-sm text-gray-500">Chưa có giao dịch — thử bấm Tải lại.</Text>
            <TouchableOpacity onPress={loadTransactions} className="mt-2 py-2 px-3 bg-teal-500 rounded">
                <Text className="text-white">Tải lại</Text>
            </TouchableOpacity>
        </View>
    ), [loadTransactions]);

    const renderHeader = useCallback(() => (
        <View className="p-4">
            <BalanceCard balance={balance} />

            {!walletLoading && wallet ? (
                <View className="mt-2 flex-row justify-between items-center bg-white p-3 rounded">
                    <Text className="text-sm text-gray-500">Khả dụng: {new Intl.NumberFormat('vi-VN').format(wallet.availableVND ?? wallet.available ?? 0)}₫</Text>
                    <Text className="text-sm text-gray-500">Khóa: {new Intl.NumberFormat('vi-VN').format(wallet.lockedVND ?? wallet.locked ?? 0)}₫</Text>
                </View>
            ) : walletLoading ? (
                <View className="mt-2">
                    <ActivityIndicator />
                </View>
            ) : null}

            <View className="mt-4">
                <ActionButtons onDeposit={() => navigation.navigate('Deposit')} onWithdraw={() => navigation.navigate('Withdraw')} onOpenWithdrawals={() => setWithdrawalsModalVisible(true)} withdrawalsCount={withdrawals.length} />
            </View>

            <Text className="text-lg font-semibold mt-4 text-center">Giao dịch</Text>

            <View className="my-3">
                
                <FlatList
                    horizontal
                    data={filterItems}
                    keyExtractor={item => item.key}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContainer}
                    renderItem={({ item }) => (
                        <TouchableHighlight
                            underlayColor="#e5e7eb"
                            className={`py-2 px-3 rounded-full mx-1 ${selectedType === item.value ? 'bg-teal-500' : (!selectedType && item.value === null) ? 'bg-teal-500' : 'bg-gray-100'}`}
                            onPress={() => setSelectedType(selectedType === item.value ? null : item.value)}
                        >
                            <Text className={`${selectedType === item.value ? 'text-white' : ((!selectedType && item.value === null) ? 'text-white' : 'text-gray-700')} font-semibold`}>{item.label}</Text>
                        </TouchableHighlight>
                    )}
                />
            </View>

            <TransactionChart transactions={transactions} typeLabels={TYPE_LABELS} />
        </View>
    ), [balance, wallet, walletLoading, withdrawals.length, selectedType, filterItems, transactions, navigation]);

    return (
        <View className="flex-1 bg-[#FFFAF0]">
            
            {/* Header with back button */}
            <View className="flex-row items-center px-4 py-3 bg-white">
                <TouchableOpacity onPress={() => (navigation as any).reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'TraineeProfile' } }] })} className="p-2">
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>
                <Text className="flex-1 text-center text-lg font-bold">Ví</Text>
                <View className="w-8" />
            </View>
          
            {/* Main scrollable content: use a single FlatList for transactions and a header component */}
            <FlatList
                contentContainerStyle={styles.listContent}
                data={filtered.map(f => ({ id: f.transactionId, title: TYPE_LABELS[f.transactionType] ?? f.transactionType, amount: f.amount, date: f.transactionDate.slice(0, 10), type: (f.transactionType === 'WALLET_TOP_UP' ? 'deposit' : 'withdraw') as 'deposit'|'withdraw', raw: f }))}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <TransactionItem tx={{ ...item, type: item.type }} onPress={() => onTransactionPress(item.raw)} />}
                ListEmptyComponent={renderEmpty}
                ListHeaderComponent={renderHeader}
            />

            {/* improved withdrawals modal */}
            <Modal visible={withdrawalsModalVisible} animationType="slide" onRequestClose={() => setWithdrawalsModalVisible(false)}>
                <View className="flex-1 bg-white p-4">
                    <View className="flex-row items-center mb-3">
                        <TouchableOpacity onPress={() => setWithdrawalsModalVisible(false)}>
                            <Text className="text-lg">←</Text>
                        </TouchableOpacity>
                        <Text className="flex-1 text-center font-bold">Yêu cầu rút tiền</Text>
                        <View className="w-8" />
                    </View>

                    <View className="mb-3">
                        <TextInput value={''} onChangeText={() => {}} placeholder="Tìm kiếm..." className="border border-gray-200 rounded p-3 bg-gray-50" />
                    </View>

                    {withdrawalsLoading ? (
                        <ActivityIndicator />
                    ) : (
                        <FlatList
                            data={withdrawals}
                            keyExtractor={(i) => i.walletWithdrawalId}
                            ItemSeparatorComponent={WithdrawalsSeparator}
                            renderItem={({ item }) => (
                                <TouchableOpacity className="bg-white rounded-lg p-3 shadow flex-row items-center" onPress={() => openWithdrawalDetail(item.walletWithdrawalId)}>
                                    {item.bankLogo ? (
                                        <Image source={{ uri: item.bankLogo }} style={styles.bankLogoSmall} />
                                    ) : (
                                        <View className="w-12 h-12 bg-gray-100 rounded-lg mr-3" />
                                    )}

                                    <View style={styles.flex1}>
                                        <Text className="font-semibold">{item.bankName}</Text>
                                        <Text className="text-sm text-gray-500">{item.recipientName} • {item.bankAccountNumber}</Text>
                                        <Text className="text-sm text-gray-500 mt-1">{new Intl.NumberFormat('vi-VN').format(item.amount)}₫</Text>
                                    </View>

                                    <View className="items-end">
                                        <View className={`px-2 py-1 rounded-full ${item.status === 'PENDING' ? 'bg-yellow-100' : item.status === 'COMPLETED' ? 'bg-green-100' : 'bg-gray-100'}`}>
                                            <Text className={`${item.status === 'PENDING' ? 'text-yellow-700' : item.status === 'COMPLETED' ? 'text-green-700' : 'text-gray-700'} text-xs font-semibold`}>{item.status}</Text>
                                        </View>
                                        <Text className="text-xs text-gray-400 mt-2">{new Date(item.requestedAt).toLocaleString()}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </Modal>

            {/* withdrawal detail & edit modal */}
            <Modal visible={detailModalVisible} animationType="slide" onRequestClose={() => { setDetailModalVisible(false); setSelectedWithdrawal(null); }}>
                <View className="flex-1 bg-white p-4">
                    <View className="flex-row items-center mb-3">
                        <TouchableOpacity onPress={() => { setDetailModalVisible(false); setSelectedWithdrawal(null); }}>
                            <Text className="text-lg">←</Text>
                        </TouchableOpacity>
                        <Text className="flex-1 text-center font-bold">Chi tiết yêu cầu</Text>
                        <View className="w-8" />
                    </View>

                    {detailLoading ? (
                        <ActivityIndicator />
                    ) : selectedWithdrawal ? (
                        <View className="bg-white rounded-lg p-4 shadow">
                            <View className="flex-row items-center mb-4">
                                {selectedWithdrawal.bankLogo ? (
                                    <Image source={{ uri: selectedWithdrawal.bankLogo }} style={styles.bankLogoLarge} />
                                ) : (
                                    <View className="w-16 h-16 bg-gray-100 rounded-lg mr-3" />
                                )}
                                <View style={styles.flex1}>
                                    <Text className="font-semibold text-lg">{selectedWithdrawal.bankName}</Text>
                                    <Text className="text-sm text-gray-500">{selectedWithdrawal.bankAccountNumber}</Text>
                                </View>
                            </View>

                            <View className="mb-3">
                                <Text className="text-sm text-gray-500">Người nhận</Text>
                                <Text className="font-semibold">{selectedWithdrawal.recipientName}</Text>
                            </View>

                            <View className="mb-3">
                                <Text className="text-sm text-gray-500">Số tiền (VND)</Text>
                                <TextInput value={editAmount} onChangeText={(t) => setEditAmount(formatNumberInput(t))} keyboardType="numeric" className="border border-gray-200 rounded p-3 bg-white text-lg mt-2" />
                            </View>

                            <View className="mb-3">
                                <Text className="text-sm text-gray-500">Ghi chú</Text>
                                <TextInput value={editNote} onChangeText={setEditNote} multiline className="border border-gray-200 rounded p-3 bg-white text-sm mt-2" />
                            </View>

                            <View className="mb-4">
                                <Text className="text-sm text-gray-500">Trạng thái</Text>
                                <Text className="font-semibold mt-1">{selectedWithdrawal.status}</Text>
                                <Text className="text-xs text-gray-400 mt-2">Yêu cầu lúc: {new Date(selectedWithdrawal.requestedAt).toLocaleString()}</Text>
                            </View>

                            <View className="flex-row ">
                                <TouchableOpacity disabled={selectedWithdrawal.status !== 'PENDING' || detailLoading} onPress={handleUpdateSelected} className={`flex-1 py-3 mr-2 ${selectedWithdrawal.status === 'PENDING' ? 'bg-yellow-500' : 'bg-gray-300'} rounded items-center`}>
                                    <Text className="text-white font-semibold">Cập nhật</Text>
                                </TouchableOpacity>

                                <TouchableOpacity disabled={selectedWithdrawal.status !== 'PENDING' || detailLoading} onPress={handleCancelSelected} className={`flex-1 py-3 ${selectedWithdrawal.status === 'PENDING' ? 'bg-red-600' : 'bg-gray-300'} rounded items-center`}>
                                    <Text className="text-white font-semibold">Hủy</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : null}
                </View>
            </Modal>
         </View>
     );
 }
