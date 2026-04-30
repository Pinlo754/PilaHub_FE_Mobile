import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAddresses, deleteAddress } from '../../services/address';

const COLORS = {
  bg: '#FFF9F3',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  primary: '#8B3F2D',
  accent: '#CD853F',
  border: '#F1E7DC',
  danger: '#EF4444',
  success: '#047857',
  successBg: '#ECFDF5',
  soft: '#FFF7ED',
};

function EmptyAddress({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <Ionicons name="location-outline" size={42} color={COLORS.accent} />
      </View>

      <Text style={styles.emptyTitle}>Chưa có địa chỉ giao hàng</Text>

      <Text style={styles.emptyDesc}>
        Thêm địa chỉ để hệ thống tính phí vận chuyển và giao hàng chính xác hơn.
      </Text>

      <TouchableOpacity onPress={onAdd} style={styles.emptyAddBtn}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.emptyAddText}>Thêm địa chỉ mới</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AddressListScreen({ route }: any) {
  const navigation: any = useNavigation();

  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);

    try {
      const data = await getAddresses();
      setAddresses(data || []);
    } catch (e) {
      console.warn('load addresses failed', e);
      Alert.alert('Lỗi', 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  const goAdd = () => {
    navigation.navigate('AddressForm', { onSaved: load });
  };

  const handleEdit = (addr: any) => {
    navigation.navigate('AddressForm', { address: addr, onSaved: load });
  };

  const handleDelete = (addr: any) => {
    Alert.alert(
      'Xoá địa chỉ',
      `Bạn có chắc muốn xoá địa chỉ của ${addr.receiverName || 'người nhận'} không?`,
      [
        {
          text: 'Huỷ',
          style: 'cancel',
        },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteAddress(addr.addressId);
              await load();
            } catch (e) {
              console.warn('delete address failed', e);
              Alert.alert('Lỗi', 'Không thể xoá địa chỉ');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderAddress = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onSelect(item)}
        style={styles.addressCard}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="home-outline" size={20} color={COLORS.primary} />
          </View>

          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.receiverName} numberOfLines={1}>
                {item.receiverName || 'Người nhận'}
              </Text>

              {item.isDefault ? (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Mặc định</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.phoneText}>
              {item.receiverPhone || 'Chưa có số điện thoại'}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </View>

        <View style={styles.addressLineBox}>
          <Ionicons name="location-outline" size={16} color={COLORS.accent} />
          <Text style={styles.addressLine} numberOfLines={3}>
            {item.addressLine || 'Chưa có địa chỉ'}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => onSelect(item)}
            style={[styles.actionBtn, styles.selectBtn]}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.selectBtnText}>Chọn địa chỉ</Text>
          </TouchableOpacity>

          <View style={styles.rightActions}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
              <Ionicons name="pencil-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtnDanger}>
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.headerIcon}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>Địa chỉ giao hàng</Text>
            <Text style={styles.subtitle}>
              {addresses.length > 0
                ? `${addresses.length} địa chỉ đã lưu`
                : 'Chọn hoặc thêm địa chỉ nhận hàng'}
            </Text>
          </View>

          <TouchableOpacity onPress={goAdd} style={styles.addCircleBtn}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải địa chỉ...</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item: any, index) => String(item.addressId ?? index)}
          renderItem={renderAddress}
          contentContainerStyle={[
            styles.listContent,
            addresses.length === 0 ? styles.listEmptyContent : null,
          ]}
          ListEmptyComponent={<EmptyAddress onAdd={goAdd} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    color: COLORS.text,
    fontWeight: '900',
    fontSize: 20,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  addCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.muted,
    fontWeight: '600',
  },

  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  addressCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiverName: {
    flexShrink: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },
  defaultBadge: {
    marginLeft: 8,
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  defaultBadgeText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '800',
  },
  phoneText: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },

  addressLineBox: {
    marginTop: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressLine: {
    flex: 1,
    marginLeft: 8,
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

  actionRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  selectBtn: {
    backgroundColor: COLORS.primary,
  },
  selectBtnText: {
    color: '#fff',
    fontWeight: '800',
    marginLeft: 6,
    fontSize: 12,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  iconBtnDanger: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 26,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyDesc: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  emptyAddBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyAddText: {
    color: '#fff',
    fontWeight: '800',
    marginLeft: 6,
  },
});