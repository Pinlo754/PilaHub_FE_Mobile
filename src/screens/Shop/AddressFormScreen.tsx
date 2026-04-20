import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet,  Pressable, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createAddress, updateAddress } from '../../services/address';
import { getProvinces, getDistricts, getWards } from '../../services/ghn';
import { Picker } from '@react-native-picker/picker';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddressFormScreen({ route }: any) {
  const navigation: any = useNavigation();
  const isModal = Boolean(route?.params?.asModal);
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const editingAddress = route?.params?.address ?? null;

  // prefill simple fields if editing
  React.useEffect(() => {
    if (!editingAddress) return;
    setReceiverName(editingAddress.receiverName || '');
    setReceiverPhone(editingAddress.receiverPhone || '');
    setAddressLine(editingAddress.addressLine || '');
    setIsDefault(!!editingAddress.isDefault);
  }, [editingAddress]);

  // If the saved addressLine is incomplete, or the user selects a ward/district,
  // compose a fuller address line from ward/district/province and update
  // when needed. Also ensure that when a ward is selected it appears in the field.
  React.useEffect(() => {
    try {
      const provName = provinces.find(p => p.provinceId === selectedProvince)?.provinceName ?? '';
      const distName = districts.find(d => d.districtId === selectedDistrict)?.districtName ?? '';
      const wardName = wards.find(w => w.wardCode === selectedWard)?.wardName ?? '';
      const composed = [wardName, distName, provName].filter(Boolean).join(', ');
      const current = (addressLine || '').trim();
      const provLower = provName.trim().toLowerCase();
      if (!composed) return;
      // Replace when empty/short/or equals province only
      if (!current || current.length < 6 || (provLower && current.toLowerCase() === provLower)) {
        setAddressLine(composed);
        return;
      }
      // If user selected a ward that is not present in current addressLine, insert it
      if (wardName) {
        const curLower = current.toLowerCase();
        if (!curLower.includes(wardName.toLowerCase())) {
          // prefer prepending ward before existing district/province
          const newLine = [wardName, distName || current, provName].filter(Boolean).join(', ');
          setAddressLine(newLine);
        }
      }
    } catch { /* ignore */ }
  }, [selectedProvince, selectedDistrict, selectedWard, provinces, districts, wards, editingAddress, addressLine]);

  React.useEffect(() => { (async () => {
     try {
       const p = await getProvinces();
       setProvinces(p || []);
       // if editing and province name provided, select matching province id
       if (editingAddress && editingAddress.province) {
         const found = (p || []).find((pp: any) => (pp.provinceName || '').toLowerCase() === (editingAddress.province || '').toLowerCase() || (pp.provinceName || '').toLowerCase() === (editingAddress.city || '').toLowerCase());
         if (found) setSelectedProvince(found.provinceId);
       }
     } catch { /* ignore */ }
  })(); }, [editingAddress]);

  React.useEffect(() => { (async () => {
     if (!selectedProvince) return setDistricts([]);
     try {
       const d = await getDistricts(selectedProvince);
       setDistricts(d || []);
       setSelectedDistrict(null);
       setWards([]);
       setSelectedWard(null);
      // if editing and district name provided, select matching district id
      if (editingAddress && editingAddress.district) {
        const foundD = (d || []).find((dd: any) => (dd.districtName || '').toLowerCase() === (editingAddress.district || '').toLowerCase());
        if (foundD) setSelectedDistrict(foundD.districtId);
      }
     } catch { /* ignore */ }
  })(); }, [selectedProvince, editingAddress]);

  React.useEffect(() => { (async () => {
     if (!selectedDistrict) return setWards([]);
     try {
       const w = await getWards(selectedDistrict);
       setWards(w || []);
       setSelectedWard(null);
       // if editing and ward name provided, select matching ward code
       if (editingAddress && editingAddress.ward) {
         const foundW = (w || []).find((ww: any) => (ww.wardName || '').toLowerCase() === (editingAddress.ward || '').toLowerCase());
         if (foundW) setSelectedWard(foundW.wardCode);
       }
     } catch { /* ignore */ }
  })(); }, [selectedDistrict, editingAddress]);

  // Auto-fill addressLine from selected ward/district/province if user hasn't typed
  React.useEffect(() => {
    const provName = provinces.find(p => p.provinceId === selectedProvince)?.provinceName ?? '';
    const distName = districts.find(d => d.districtId === selectedDistrict)?.districtName ?? '';
    const wardName = wards.find(w => w.wardCode === selectedWard)?.wardName ?? '';
    if ((!addressLine || addressLine.trim() === '') && (wardName || distName || provName)) {
      const parts = [] as string[];
      if (wardName) parts.push(wardName);
      if (distName) parts.push(distName);
      if (provName) parts.push(provName);
      setAddressLine(parts.join(', '));
    }
  }, [selectedProvince, selectedDistrict, selectedWard, provinces, districts, wards, addressLine]);

  const onSave = async () => {
    if (!receiverName || !receiverPhone || !addressLine) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      // Map selected ids to human-readable names required by backend
      const provName = provinces.find(p => p.provinceId === selectedProvince)?.provinceName ?? '';
      const distName = districts.find(d => d.districtId === selectedDistrict)?.districtName ?? '';
      const wardName = wards.find(w => w.wardCode === selectedWard)?.wardName ?? '';
      const payload: any = { receiverName, receiverPhone, addressLine, isDefault, province: provName, city: provName, district: distName, ward: wardName };
      if (editingAddress && editingAddress.addressId) {
        await updateAddress(editingAddress.addressId, payload);
      } else {
        await createAddress(payload);
      }
      const successMsg = editingAddress && editingAddress.addressId ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ';
      Alert.alert('Thành công', successMsg, [{ text: 'OK', onPress: () => {
        if (route.params && typeof route.params.onSaved === 'function') route.params.onSaved();
        navigation.goBack();
      }}]);
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  // render content (shared between modal and screen)
  const Content = (
    <View style={styles.card}>
      <Text style={styles.label}>Người nhận</Text>
      <TextInput value={receiverName} onChangeText={setReceiverName} placeholder="Tên người nhận" style={styles.input} />

      <Text style={styles.label}>Số điện thoại</Text>
      <TextInput value={receiverPhone} onChangeText={setReceiverPhone} placeholder="Số điện thoại" keyboardType="phone-pad" style={styles.input} />

      <Text style={styles.label}>Tỉnh / Thành</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={selectedProvince} onValueChange={(v) => setSelectedProvince(v)}>
          <Picker.Item label="Chọn tỉnh" value={null} />
          {provinces.map((p) => <Picker.Item key={p.provinceId} label={p.provinceName} value={p.provinceId} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Quận / Huyện</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={selectedDistrict} onValueChange={(v) => setSelectedDistrict(v)} enabled={districts.length > 0}>
          <Picker.Item label="Chọn quận/huyện" value={null} />
          {districts.map((d) => <Picker.Item key={d.districtId} label={d.districtName} value={d.districtId} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Phường / Xã</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={selectedWard} onValueChange={(v) => setSelectedWard(v)} enabled={wards.length > 0}>
          <Picker.Item label="Chọn phường/xã" value={null} />
          {wards.map((w) => <Picker.Item key={w.wardCode} label={w.wardName} value={w.wardCode} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Địa chỉ</Text>
      <TextInput value={addressLine} onChangeText={setAddressLine} placeholder="Số nhà, đường, phường..." style={styles.input} />

      <View style={styles.defaultRow}>
        <TouchableOpacity onPress={() => setIsDefault(!isDefault)} style={styles.checkbox}>
          {isDefault ? <Text>✓</Text> : null}
        </TouchableOpacity>
        <Text>Đặt làm địa chỉ mặc định</Text>
      </View>

      <TouchableOpacity onPress={onSave} style={styles.saveBtn} activeOpacity={0.85}>
        <View style={styles.saveBtnInner}>
          <Ionicons name="checkmark" size={16} color="#fff" style={styles.saveBtnIcon} />
          <Text style={styles.saveBtnText}>{loading ? 'Đang lưu...' : (editingAddress ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ')}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (isModal) {
    return (
      <Modal visible transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={modalStyles.modalWrap}>
          <View style={modalStyles.backdrop}>
            <View style={modalStyles.sheet}>
              <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
                  <Text style={styles.headerBtnText}>✕</Text>
                </Pressable>
                <Text style={styles.headerTitle}>{route.params?.address ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}</Text>
                <View style={styles.headerBtn} />
              </View>
              <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {Content}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{route.params?.address ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {Content}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFAF0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: 'transparent' },
  headerBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText: { fontSize: 22, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', flex: 1, color: '#111827' },
  container: { flex: 1 },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 3 },
  label: { marginTop: 8, color: '#374151', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginTop: 6, backgroundColor: '#fff' },
  defaultRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  saveBtn: { marginTop: 24, backgroundColor: '#A0522D', padding: 0, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 6 }, shadowRadius: 10, elevation: 4 },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 18 },
  saveBtnIcon: { marginRight: 8, opacity: 0.95 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  pickerWrap: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginTop: 6, backgroundColor: '#fff' }
});

const modalStyles = StyleSheet.create({
  modalWrap: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 },
  sheet: { backgroundColor: '#FFFAF0', borderRadius: 16, padding: 12 },
});
