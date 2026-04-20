import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getAddresses, deleteAddress } from '../../services/address';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddressListScreen({ route }: any) {
  const navigation: any = useNavigation();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAddresses();
      setAddresses(data || []);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // reload when returning to this screen (ensure updates from AddressForm are reflected)
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      load();
    });
    return unsub;
  }, [navigation]);

  const onSelect = (addr: any) => {
    if (route.params && typeof route.params.onSelect === 'function') {
      route.params.onSelect(addr);
      navigation.goBack();
      return;
    }
    navigation.navigate('Checkout', { selectedAddress: addr });
  };

  const onBack = () => navigation.goBack();

  // Edit navigates to AddressForm screen (single source for add/edit)
  const handleEdit = (addr: any) => navigation.navigate('AddressForm', { address: addr, onSaved: load });

  const handleDelete = (addr: any) => {
    Alert.alert('Xóa địa chỉ', 'Bạn có chắc muốn xóa địa chỉ này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            setLoading(true);
            await deleteAddress(addr.addressId);
            await load();
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa địa chỉ');
          } finally {
            setLoading(false);
          }
        } }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Địa chỉ giao hàng</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddressForm', { onSaved: load })} style={styles.addBtn}>
          <Text style={styles.addText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator style={styles.loading} /> : (
        <FlatList
          data={addresses}
          keyExtractor={(i: any) => i.addressId}
          renderItem={({ item }) => (
            <View style={styles.addressRow}>
              <TouchableOpacity onPress={() => onSelect(item)} style={styles.flexGrow}>
                <Text style={styles.addrName}>{item.receiverName} {item.isDefault ? '(Mặc định)' : ''}</Text>
                <Text style={styles.addrLine}>{item.addressLine}</Text>
                <Text style={styles.addrPhone}>{item.receiverPhone}</Text>
              </TouchableOpacity>
              <View style={styles.rowActions}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
                  <Ionicons name="pencil" size={18} color="#A0522D" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
                  <Ionicons name="trash" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
           )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFAF0' },
  headerRow: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIcon: { width: 36, alignItems: 'flex-start' },
  title: { fontWeight: '800', fontSize: 18, textAlign: 'center', flex: 1, color: '#111827' },
  addBtn: { paddingHorizontal: 8, alignItems: 'flex-end' },
  addText: { color: '#A0522D', fontWeight: '700' },
  loading: { marginTop: 40 },
  addressRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center' },
  flexGrow: { flex: 1 },
  addrName: { fontWeight: '700' },
  addrLine: { color: '#6B7280' },
  addrPhone: { color: '#6B7280', marginTop: 6 },
  rowActions: { flexDirection: 'row', marginLeft: 12 },
  iconBtn: { padding: 6 },
});
