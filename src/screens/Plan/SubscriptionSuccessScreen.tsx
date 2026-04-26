import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

export default function SubscriptionSuccessScreen() {
  const navigation: any = useNavigation();
  const route: any = useRoute();
  const subscription = route.params?.subscription ?? null;
  const packageName = subscription?.subscribedPackage?.packageName ?? subscription?.subscribedPackage?.packageName ?? null;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle-outline" size={72} color="#10B981" />
      </View>
      <Text style={styles.title}>Thanh toán thành công</Text>
      <Text style={styles.subtitle}>{packageName ? `Bạn đã đăng ký: ${packageName}` : 'Giao dịch đã hoàn tất.'}</Text>

      <View style={styles.actionsWrap}>
        <TouchableOpacity onPress={() => navigation.navigate('Plan' as never)} style={styles.viewOrderBtn}>
          <Text style={styles.viewOrderText}>Quay lại Gói</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {
          try {
            // reset stack so TabNavigator is the root and open Home tab
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'Home' } }] });
          } catch {
            // fallback: navigate to MainTabs
            try { navigation.navigate('MainTabs' as never, { screen: 'Home' } as never); } catch { navigation.navigate('Home' as never); }
          }
        }} style={styles.homeBtn}>
          <Text style={styles.homeBtnText}>Về trang chính</Text>
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
