import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

export default function OrderSuccessScreen() {
  const navigation: any = useNavigation();
  const route: any = useRoute();
  const orders = route.params?.orders ?? [];
  const firstOrder = Array.isArray(orders) && orders.length > 0 ? orders[0] : null;
  const firstOrderId = firstOrder?.orderId ?? firstOrder?.orderIdString ?? null;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle-outline" size={72} color="#10B981" />
      </View>
      <Text style={styles.title}>Đặt hàng thành công</Text>
      <Text style={styles.subtitle}>Cảm ơn bạn. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.</Text>

      <View style={styles.actionsWrap}>
        {firstOrderId ? (
          <TouchableOpacity onPress={() => navigation.navigate('OrderDetail' as never, { orderId: String(firstOrderId) } as never)} style={styles.viewOrderBtn}>
            <Text style={styles.viewOrderText}>Xem đơn hàng</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity onPress={() => navigation.navigate('Home' as never)} style={styles.homeBtn}>
          <Text style={styles.homeBtnText}>Quay về trang chính</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FFF9F3' },
  iconWrap: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  actionsWrap: { width: '100%', gap: 12 },
  viewOrderBtn: { backgroundColor: '#E6F4FF', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 8 },
  viewOrderText: { color: '#055160', fontWeight: '700' },
  homeBtn: { backgroundColor: '#8B3F2D', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  homeBtnText: { color: '#fff', fontWeight: '800' },
});
