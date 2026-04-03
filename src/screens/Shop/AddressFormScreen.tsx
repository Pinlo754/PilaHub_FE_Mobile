import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createAddress } from '../../services/address';
import { getProvinces, getDistricts, getWards } from '../../services/ghn';
import { Picker } from '@react-native-picker/picker';

export default function AddressFormScreen({ route }: any) {
  const navigation: any = useNavigation();
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

  React.useEffect(() => { (async () => {
    try {
      const p = await getProvinces();
      setProvinces(p || []);
    } catch { /* ignore */ }
  })(); }, []);

  React.useEffect(() => { (async () => {
    if (!selectedProvince) return setDistricts([]);
    try {
      const d = await getDistricts(selectedProvince);
      setDistricts(d || []);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
    } catch { /* ignore */ }
  })(); }, [selectedProvince]);

  React.useEffect(() => { (async () => {
    if (!selectedDistrict) return setWards([]);
    try {
      const w = await getWards(selectedDistrict);
      setWards(w || []);
      setSelectedWard(null);
    } catch { /* ignore */ }
  })(); }, [selectedDistrict]);

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
      await createAddress(payload);
      Alert.alert('Thành công', 'Đã thêm địa chỉ', [{ text: 'OK', onPress: () => {
        if (route.params && typeof route.params.onSaved === 'function') route.params.onSaved();
        navigation.goBack();
      }}]);
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Thêm địa chỉ mới</Text>

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

      <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>{loading ? 'Đang lưu...' : 'Lưu địa chỉ'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  heading: { fontWeight: '800', fontSize: 16, marginBottom: 8 },
  label: { marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, marginTop: 6 },
  defaultRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  saveBtn: { marginTop: 24, backgroundColor: '#2563EB', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  pickerWrap: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginTop: 6 }
});
