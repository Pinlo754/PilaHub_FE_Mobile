import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Modal, Image, ScrollView, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { fetchWithdrawalBanks, createWalletWithdrawal, fetchMyWallet } from '../../services/wallet';
import ModalPopup from '../../components/ModalPopup';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WithdrawScreen() {
  const navigation = useNavigation<any>();
  const [banks, setBanks] = useState<Array<any>>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [selectedBank, setSelectedBank] = useState<any | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [amount, setAmount] = useState('');
  const [amountSelection, setAmountSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [amountError, setAmountError] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState<any | null>(null);
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [modalProps, setModalProps] = useState<any>({ visible: false });

  const loadBanks = useCallback(async () => {
    setLoadingBanks(true);
    try {
      const res = await fetchWithdrawalBanks();
      if (res.ok) setBanks(res.data);
      else showModal('Lỗi', res.error?.message ?? 'Không thể tải danh sách ngân hàng');
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingBanks(false);
    }
  }, []);

  useEffect(() => {
    loadBanks();
    loadWallet();
  }, [loadBanks]);

  function showModal(title: string, message?: string, mode: string = 'noti', onConfirm?: () => void) {
    const normalizedMode = mode === 'notify' ? 'noti' : mode;
    setModalProps({
      visible: true,
      mode: normalizedMode,
      titleText: title,
      contentText: message ?? '',
      onClose: () => setModalProps({ visible: false }),
      ...(onConfirm ? { onConfirm } : {}),
      ...(normalizedMode === 'confirm' ? { onCancel: () => setModalProps({ visible: false }) } : {}),
    });
  }

  async function loadWallet() {
    try {
      const res = await fetchMyWallet();
      if (res.ok) setWallet(res.data);
    } catch (e) {
      console.warn(e);
    }
  }

  const balance = useMemo(() => wallet?.availableVND ?? wallet?.available ?? 0, [wallet]);

  async function submit() {
    const amt = Number((amountRaw || '')) || 0;
    if (!recipientName) return showModal('Lỗi', 'Nhập tên người nhận');
    if (!accountNumber) return showModal('Lỗi', 'Nhập số tài khoản');
    if (!selectedBank) return showModal('Lỗi', 'Chọn ngân hàng');
    if (!amt || amt <= 0) return showModal('Lỗi', 'Nhập số tiền hợp lệ');
    if (amt > balance) return showModal('Lỗi', 'Số dư không đủ');

    setSubmitting(true);
    try {
      const payload = {
        recipientName,
        bankAccountNumber: accountNumber,
        bankCode: selectedBank.bankCode,
        bankName: selectedBank.bankName,
        bankLogo: selectedBank.bankLogo,
        amount: amt,
        note,
      };

      const res = await createWalletWithdrawal(payload);
      if (!res.ok) {
        showModal('Lỗi', res.error?.message ?? 'Không thể tạo yêu cầu rút tiền');
        return;
      }

      // success - show modal and go back on confirm (translate status)
      showModal('Yêu cầu rút tiền đã được tạo', 'Trạng thái: Đang xử lý', 'noti', () => navigation.goBack());
    } catch (e) {
      console.warn(e);
      showModal('Lỗi', 'Không thể tạo yêu cầu rút tiền');
    } finally {
      setSubmitting(false);
    }
  }

  const numericAccountChange = (text: string) => setAccountNumber(text.replace(/[^0-9]/g, ''));

  // validate amount against balance whenever it changes; keep raw digits and formatted display
  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmountRaw(cleaned);
    const formatted = cleaned ? Number(cleaned).toLocaleString('vi-VN') : '';
    setAmount(formatted);
    // keep cursor at end for simplicity
    setAmountSelection({ start: formatted.length, end: formatted.length });
    const amt = Number(cleaned || 0);
    if (amt > (balance || 0)) setAmountError('Số tiền lớn hơn số dư khả dụng');
    else setAmountError('');
  };

  const canSubmit = !!recipientName && !!accountNumber && !!selectedBank && Number(amountRaw || 0) > 0 && Number(amountRaw || 0) <= (balance || 0) && !submitting && !amountError;

  return (
    <SafeAreaView className="flex-1 bg-[#FFFAF0] p-4">
      <View className="flex-row items-center mb-3">
       <TouchableOpacity onPress={() => navigation.goBack()} className="bg-white p-2 rounded-full shadow mr-3">
          <Ionicons name="arrow-back" size={20} color="#111" />

        </TouchableOpacity>
        <Text className="text-lg font-semibold">Rút tiền</Text>
      </View>

      <View className="mb-3">
        <Text className="text-sm text-gray-500">Số dư khả dụng</Text>
        <Text className="text-lg font-bold">{new Intl.NumberFormat('vi-VN').format(balance)}₫</Text>
      </View>

      <View className="mb-3">
        <Text className="text-sm text-gray-500 mb-1">Chọn ngân hàng</Text>
        {loadingBanks ? (
          <ActivityIndicator />
        ) : (
          <>
            <TouchableOpacity onPress={() => setBankModalVisible(true)} className="flex-row items-center p-3 bg-white rounded border border-gray-200">
              {selectedBank?.bankLogo ? (
                <Image source={{ uri: selectedBank.bankLogo }} style={styles.selectedLogo} />
              ) : (
                <View className="w-7 h-7 bg-gray-100 rounded mr-2" />
              )}
              <Text className="flex-1 text-gray-800">{selectedBank?.bankName ?? 'Chọn ngân hàng'}</Text>
              <Text className="text-gray-400">▾</Text>
            </TouchableOpacity>

            <Modal visible={bankModalVisible} animationType="slide" transparent>
              <TouchableOpacity activeOpacity={1} onPress={() => setBankModalVisible(false)} className="flex-1 bg-black/30 justify-end">
                <TouchableOpacity activeOpacity={1} className="bg-white rounded-t-xl max-h-3/5" onPress={() => {}}>
                  <View className="p-3 border-b border-gray-100 flex-row items-center justify-between">
                    <Text className="font-semibold">Chọn ngân hàng</Text>
                    <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                      <Text className="text-gray-500">Đóng</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView>
                    {banks.map(b => (
                      <TouchableOpacity key={b.bankCode} onPress={() => { setSelectedBank(b); setBankModalVisible(false); }} className={`p-3 flex-row items-center ${selectedBank?.bankCode === b.bankCode ? 'bg-gray-50' : ''}`}>
                        {b.bankLogo ? <Image source={{ uri: b.bankLogo }} style={styles.bankLogo} /> : <View className="w-9 h-6 bg-gray-100 mr-3" />}
                        <View className="flex-1">
                          <Text className="text-sm font-medium">{b.bankName}</Text>
                          <Text className="text-xs text-gray-400">{b.bankCode}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          </>
        )}
      </View>

      <View className="mb-3">
        <Text className="text-sm text-gray-500 mb-1">Tên người nhận</Text>
        <TextInput value={recipientName} onChangeText={setRecipientName} className="border border-gray-200 rounded p-2 bg-white" />
      </View>

      <View className="mb-3">
        <Text className="text-sm text-gray-500 mb-1">Số tài khoản</Text>
        <TextInput value={accountNumber} keyboardType="numeric" onChangeText={numericAccountChange} className="border border-gray-200 rounded p-2 bg-white" />
      </View>

      <View className="mb-3">
        <Text className="text-sm text-gray-500 mb-1">Số tiền</Text>
        <TextInput
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
          selection={amountSelection}
          onSelectionChange={({ nativeEvent }) => setAmountSelection(nativeEvent.selection)}
          className="border border-gray-200 rounded p-2 bg-white"
        />
        {amountError ? <Text className="text-sm text-red-600 mt-1">{amountError}</Text> : null}
      </View>

      <View className="mb-3">
        <Text className="text-sm text-gray-500 mb-1">Ghi chú (tùy chọn)</Text>
        <TextInput value={note} onChangeText={setNote} className="border border-gray-200 rounded p-2 bg-white" />
      </View>

      <View className="mt-4">
        <TouchableOpacity className={`py-3 rounded items-center ${canSubmit ? 'bg-[#A0522D]' : 'bg-gray-300'}`} onPress={submit} disabled={!canSubmit}>
          {submitting ? <ActivityIndicator color="white" /> : <Text className={`text-white font-semibold`}>Gửi yêu cầu rút tiền</Text>}
        </TouchableOpacity>
      </View>

      <ModalPopup {...(modalProps as any)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  selectedLogo: { width: 28, height: 28, marginRight: 10, borderRadius: 4 },
  bankLogo: { width: 36, height: 24, marginRight: 12, resizeMode: 'contain' },
});
