import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAddresses } from '../../services/address';

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

  const onSelect = (addr: any) => {
    if (route.params && typeof route.params.onSelect === 'function') {
      route.params.onSelect(addr);
      navigation.goBack();
      return;
    }
    navigation.navigate('Checkout', { selectedAddress: addr });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Chọn địa chỉ giao hàng</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddressForm', { onSaved: load })}>
          <Text style={styles.addText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator style={styles.loading} /> : (
        <FlatList
          data={addresses}
          keyExtractor={(i: any) => i.addressId}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onSelect(item)} style={styles.addressRow}>
              <Text style={styles.addrName}>{item.receiverName} {item.isDefault ? '(Mặc định)' : ''}</Text>
              <Text style={styles.addrLine}>{item.addressLine}</Text>
              <Text style={styles.addrPhone}>{item.receiverPhone}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerRow: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontWeight: '800', fontSize: 18 },
  addText: { color: '#2563EB', fontWeight: '700' },
  loading: { marginTop: 40 },
  addressRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  addrName: { fontWeight: '700' },
  addrLine: { color: '#6B7280' },
  addrPhone: { color: '#6B7280', marginTop: 6 },
});
