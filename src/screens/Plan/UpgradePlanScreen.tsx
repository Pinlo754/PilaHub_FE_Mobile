import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getActivePackages, subscribeToPackage, getMySubscriptions, upgradeSubscription, getUpgradeablePackages } from '../../hooks/apiClient';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = Math.round(width * 0.78);
const SPACING = 16;

// Plans are loaded from server via /packages/active

// New cleaner card design (full-width, separated) with prominent buy button
type ActionType = 'OWNED' | 'UPGRADE' | 'SUBSCRIBE';
const Card: React.FC<{ plan: any; onDetail: () => void; actionType: ActionType; onPrimary: () => void; buyLoading?: boolean; upgradeInfo?: any }> = ({ plan, onDetail, actionType, onPrimary, buyLoading = false, upgradeInfo }) => {
  const raw = plan.raw ?? {};
  const priceNum = typeof raw.price === 'number' ? raw.price : parseFloat(plan.price as any) || 0;
  const formatCurrency = (v: number) => {
    try {
      return new Intl.NumberFormat('vi-VN').format(v) + 'đ';
    } catch {
      return v.toString();
    }
  };

  const duration = raw.durationInDays ?? null;
  const pkgType = raw.packageType ?? null;

  return (
    <View style={styles.cardFull}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTitle}>{plan.title}</Text>
          <View style={styles.metaRow}>
            {pkgType && <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{pkgType}</Text></View>}
            {duration && <View style={styles.durationBadge}><Text style={styles.durationText}>{duration} ngày</Text></View>}
          </View>
        </View>

        <View style={styles.priceBlock}>
          <Text style={styles.priceLarge}>{formatCurrency(priceNum)}</Text>
          {/* If upgradeInfo present, show finalPrice */}
          {upgradeInfo?.finalPrice ? (
            <View style={styles.upgradePriceWrapper}>
              <Text style={[styles.priceLarge, styles.upgradeFinalPriceSmall]}>{formatCurrency(Number(upgradeInfo.finalPrice))}</Text>
              <Text style={styles.pricePeriod}>/ tháng</Text>
              <Text style={styles.upgradeProrationText}>Giảm: {formatCurrency(Number(upgradeInfo.prorationCredit ?? 0))}</Text>
            </View>
          ) : (
            <Text style={styles.pricePeriod}>/ tháng</Text>
          )}
        </View>
      </View>

      <Text style={styles.cardDesc}>{plan.desc}</Text>

      <View style={styles.bullets}>
        {plan.bullets.map((b: string, i: number) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.learnButton} onPress={onDetail}>
          <Text style={styles.learnButtonText}>Chi tiết</Text>
        </TouchableOpacity>

        {actionType === 'OWNED' && (
          <TouchableOpacity style={[styles.payButtonSmall, styles.buttonDisabled]} disabled>
            <Text style={styles.payButtonTextSmall}>Đã sở hữu</Text>
          </TouchableOpacity>
        )}

        {actionType === 'SUBSCRIBE' && (
          <TouchableOpacity style={[styles.payButtonSmall, buyLoading && styles.buttonDisabled]} onPress={onPrimary} disabled={buyLoading}>
            {buyLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonTextSmall}>Thanh toán</Text>}
          </TouchableOpacity>
        )}

        {actionType === 'UPGRADE' && (
          <TouchableOpacity style={[styles.payButtonSmall, buyLoading && styles.buttonDisabled]} onPress={onPrimary} disabled={buyLoading}>
            {buyLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonTextSmall}>Nâng cấp</Text>}
          </TouchableOpacity>
        )}
      </View>

      {actionType !== 'OWNED' ? (
        <TouchableOpacity style={[styles.buyNowButton, buyLoading && styles.buttonDisabled]} onPress={onPrimary} disabled={buyLoading}>
          {buyLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buyNowText}>{actionType === 'UPGRADE' ? '🔼 Nâng cấp ngay' : '🔥 Mua ngay'}</Text>}
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const UpgradePlanScreen: React.FC = () => {
  const navigation: any = useNavigation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [buyLoading, setBuyLoading] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any | null>(null);
  const [upgradeablePackages, setUpgradeablePackages] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchPlans = async () => {
      try {
        const mapped = await getActivePackages();
        if (mounted) setPlans(mapped);
      } catch (err) {
        console.warn('Fetch active packages failed', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const load = async () => {
      try {
        const subs = await getMySubscriptions();
        // pick first active subscription if any
        const active = (subs || []).find((s: any) => s.status === 'ACTIVE' || s.subscribedPackage?.isActive);
        if (mounted) setActiveSubscription(active ?? null);
        if (active && mounted) {
          try {
            const up = await getUpgradeablePackages();
            if (mounted) setUpgradeablePackages(up);
          } catch (e) {
            console.warn('getUpgradeablePackages failed', e);
          }
        } else {
          if (mounted) setUpgradeablePackages([]);
        }
      } catch (err) {
        console.warn('getMySubscriptions failed', err);
      }
      await fetchPlans();
    };

    load();
    return () => { mounted = false; };
  }, []);

  const openDetail = (id: string) => {
    setSelectedId(id);
    Animated.timing(expandAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };
  const closeDetail = () => {
    Animated.timing(expandAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setSelectedId(null));
  };

  const selectedPlan = plans.find(p => p.id === selectedId);
  const formatCurrency = (v: number) => {
    try { return new Intl.NumberFormat('vi-VN').format(v) + 'đ'; } catch { return String(v); }
  };

  const detailTranslate = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });
  const backdropOpacity = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });

  const handleSubscribe = async (packageId: string) => {
    if (buyLoading) return;
    try {
      setBuyLoading(true);
      // If user already has activePackageType equal to new package, server will reject.
      const res = await subscribeToPackage(packageId);
      Alert.alert('Thành công', res?.message ?? 'Đăng ký gói thành công');
      // navigate to subscription success screen
      try { navigation.navigate('SubscriptionSuccess', { subscription: res?.data ?? null } as never); } catch (e) { console.warn('navigate subscription success failed', e); }
      setSelectedId(null);
      // refresh subscriptions and packages
      try { const subs = await getMySubscriptions(); setActiveSubscription((subs || []).find((s:any)=>s.status==='ACTIVE') ?? null); } catch(e){ console.warn('refresh subscriptions failed', e); }
      try { const mapped = await getActivePackages(); setPlans(mapped); } catch(e){ console.warn('refresh packages failed', e); }
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      let msg = 'Đăng ký thất bại';

      const serverMsg = (data && typeof data.message === 'string') ? data.message : undefined;
      const serverErrorCode = data?.errorCode;

      // If insufficient balance, prompt to top up
      if (serverMsg && /insufficient balance/i.test(serverMsg)) {
        Alert.alert('Số dư không đủ', serverMsg, [
          { text: 'Nạp tiền', onPress: () => navigation.navigate('Wallet' as never) },
          { text: 'Hủy', style: 'cancel' },
        ]);
        console.warn('subscribe insufficient balance', err);
        return;
      }

      if (status === 400 && (serverErrorCode === 'ALREADY_SUBSCRIBED' || (serverMsg && /already|active|exists/i.test(serverMsg)))) {
        msg = 'Bạn đã có gói đang hoạt động.';
      } else if (status === 403) {
        msg = 'Bạn cần quyền Trainee để mua gói.';
      } else if (status === 404) {
        msg = 'Gói hoặc tài khoản không tìm thấy.';
      } else if (serverMsg) {
        msg = serverMsg;
      } else if (err?.message) {
        msg = err.message;
      }

      Alert.alert('Lỗi', msg);
      console.warn('subscribe failed', err);
    } finally {
      setBuyLoading(false);
    }
  };

  const handleUpgrade = async (newPackageId: string) => {
    if (buyLoading) return;
    try {
      setBuyLoading(true);
      const res = await upgradeSubscription(newPackageId);
      Alert.alert('Nâng cấp thành công', res?.message ?? 'Nâng cấp gói thành công');
      // navigate to subscription success
      try { navigation.navigate('SubscriptionSuccess', { subscription: res?.data ?? null } as never); } catch (e) { console.warn('navigate subscription success failed', e); }
      setSelectedId(null);
      // refresh subscriptions and upgradeable list
      try { const subs = await getMySubscriptions(); const active = (subs || []).find((s:any)=>s.status==='ACTIVE') ?? null; setActiveSubscription(active); } catch(e){ console.warn('refresh subscriptions failed', e); }
      try { const up = await getUpgradeablePackages(); setUpgradeablePackages(up); } catch(e){ console.warn('getUpgradeablePackages failed', e); }
      try { const mapped = await getActivePackages(); setPlans(mapped); } catch(e){ console.warn('refresh packages failed', e); }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message ?? err?.message ?? null;
      // If insufficient balance, offer to top up
      if (serverMsg && /insufficient balance/i.test(serverMsg)) {
        Alert.alert('Số dư không đủ', serverMsg, [
          { text: 'Nạp tiền', onPress: () => navigation.navigate('Wallet' as never) },
          { text: 'Hủy', style: 'cancel' },
        ]);
        console.warn('upgrade insufficient balance', err);
        return;
      }

      const msg = serverMsg ?? 'Nâng cấp thất bại';
      Alert.alert('Lỗi', msg);
      console.warn('upgrade failed', err);
    } finally {
      setBuyLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FEF6ED]">
      <View style={styles.header}>
        <Text className="text-lg font-semibold text-[#A0522D]">Gói nâng cấp AI</Text>
      </View>

      <Text className="text-center mt-2 text-base font-semibold text-[#111]">Lựa chọn gói AI phù hợp với bản thân</Text>

      <View style={styles.carouselHolder}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A0522D" />
            <Text style={styles.loadingText}>Đang tải gói...</Text>
          </View>
        ) : (
          <Animated.FlatList
            data={plans}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + SPACING}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: (width - CARD_WIDTH) / 2 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => {
              const inputRange = [ (index - 1) * (CARD_WIDTH + SPACING), index * (CARD_WIDTH + SPACING), (index + 1) * (CARD_WIDTH + SPACING) ];
              const scale = scrollX.interpolate({ inputRange, outputRange: [0.92, 1, 0.92], extrapolate: 'clamp' });
              const translateY = scrollX.interpolate({ inputRange, outputRange: [14, 0, 14], extrapolate: 'clamp' });
              const opacity = scrollX.interpolate({ inputRange, outputRange: [0.6, 1, 0.6], extrapolate: 'clamp' });

              const userHasActive = !!activeSubscription;
              const isOwned = userHasActive && activeSubscription?.subscribedPackage?.packageType && item.raw?.packageType && activeSubscription.subscribedPackage.packageType === item.raw.packageType;
              // Only mark upgradeable when backend says so
              const canUpgrade = upgradeablePackages.some(u => u.packageInfo?.packageId === item.id || u.packageInfo?.packageId === item.raw?.packageId || u.packageId === item.id);
              const actionType: ActionType = isOwned ? 'OWNED' : (userHasActive ? (canUpgrade ? 'UPGRADE' : 'OWNED') : 'SUBSCRIBE');
              const upgradeInfo = upgradeablePackages.find(u => u.packageInfo?.packageId === item.id || u.packageId === item.id || u.packageInfo?.packageId === item.raw?.packageId) ?? null;

              return (
                <Animated.View style={{ width: CARD_WIDTH, marginRight: SPACING, transform: [{ scale }, { translateY }], opacity }}>
                  <Card
                    plan={item}
                    onDetail={() => openDetail(item.id)}
                    actionType={actionType}
                    onPrimary={() => {
                      if (actionType === 'OWNED') return;
                      if (actionType === 'UPGRADE') return handleUpgrade(item.id);
                      return handleSubscribe(item.id);
                    }}
                    buyLoading={buyLoading}
                    upgradeInfo={upgradeInfo}
                  />
                </Animated.View>
                 );
             }}
           />
         )}
      </View>

      {/* Backdrop */}
      {selectedId && (
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents={selectedId ? 'auto' : 'none'} />
      )}

      {/* Detail sheet */}
      {selectedId && (
        <Animated.View style={[styles.detailSheet, { transform: [{ translateY: detailTranslate }] }]}>
          <View style={styles.detailHandle} />
          <Text style={styles.detailTitle}>{selectedPlan?.title}</Text>
          <Text style={styles.detailPrice}>{selectedPlan?.price} vnd / tháng</Text>
          <Text style={styles.detailDesc}>{selectedPlan?.desc}</Text>

          {/* If selected plan is upgradeable, show final price and proration */}
          {selectedPlan && (() => {
            const selUp = upgradeablePackages.find(u => u.packageInfo?.packageId === selectedPlan.id || u.packageId === selectedPlan.id || u.packageInfo?.packageId === selectedPlan.raw?.packageId);
            if (selUp) {
              return (
                <View style={styles.upgradeDetailBox}>
                  <Text style={styles.upgradeDetailTitle}>Giá sau khi áp dụng giảm/hoàn tiền:</Text>
                  <Text style={styles.upgradeDetailFinalPrice}>{formatCurrency(Number(selUp.finalPrice))}</Text>
                  <Text style={styles.upgradeDetailProration}>Miễn giảm do proration: {formatCurrency(Number(selUp.prorationCredit ?? 0))}</Text>
                </View>
              );
            }
            return null;
          })()}

          <TouchableOpacity style={[styles.payButton, buyLoading && styles.buttonDisabled]} onPress={() => selectedPlan && handleSubscribe(selectedPlan.id)} disabled={buyLoading}>
            {buyLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonText}>Thanh toán</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipButton} onPress={closeDetail}>
            <Text style={styles.skipButtonText}>Bỏ qua</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
   );
};

const styles = StyleSheet.create({
  header: { paddingTop: 12, paddingHorizontal: 12, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#A0522D' },
  hint: { textAlign: 'center', marginTop: 8, fontSize: 16, fontWeight: '600', color: '#111' },

  // List + loading
  listHolder: { flex: 1, marginTop: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  loadingContainer: { height: 240, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#666' },

  // Card (new design)
  cardFull: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  cardPressed: { opacity: 0.95 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderLeft: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  typeBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  typeBadgeText: { color: '#4F46E5', fontWeight: '700', fontSize: 12 },
  durationBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  durationText: { color: '#059669', fontWeight: '600', fontSize: 12 },

  // price block on the right
  priceBlock: { alignItems: 'flex-end' },
  priceLarge: { fontSize: 18, fontWeight: '800', color: '#A0522D' },
  pricePeriod: { fontSize: 12, color: '#A0522D' },

  cardDesc: { marginTop: 8, color: '#666' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  payButton: { backgroundColor: '#A0522D', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  payButtonText: { color: '#fff', fontWeight: '700' },
  payButtonSmall: { backgroundColor: '#A0522D', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  payButtonTextSmall: { color: '#fff', fontWeight: '700' },
  learnButton: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  learnButtonText: { color: '#A0522D', fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },

  // bullets
  bullets: { marginTop: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bulletDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#34D399', marginRight: 8 },
  bulletText: { color: '#333' },

  // Detail sheet
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  detailSheet: { position: 'absolute', left: 20, right: 20, bottom: 24, backgroundColor: '#fff', borderRadius: 14, padding: 16, maxHeight: height * 0.75, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 12 },
  detailHandle: { width: 40, height: 6, backgroundColor: '#EEE', borderRadius: 6, alignSelf: 'center', marginBottom: 12 },
  detailTitle: { fontSize: 20, fontWeight: '700' },
  detailPrice: { marginTop: 6, fontSize: 20, color: '#A0522D', fontWeight: '700' },
  detailDesc: { marginTop: 8, color: '#666' },
  detailList: { marginTop: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#34D399', marginRight: 10 },
  detailText: { color: '#333' },

  skipButton: { marginTop: 10, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  skipButtonText: { color: '#A0522D', fontWeight: '700' },

  // Buy now button (new styles)
  buyNowButton: { marginTop: 12, backgroundColor: '#FF7A45', paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowColor: '#FF7A45', shadowOpacity: 0.18, shadowRadius: 12, elevation: 6 },
  buyNowText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // carousel
  carouselHolder: { flex: 1, marginTop: 12 },
  upgradePriceWrapper: { alignItems: 'flex-end' },
  upgradeFinalPriceSmall: { fontSize: 14 },
  upgradeProrationText: { fontSize: 12, color: '#059669' },
  upgradeDetailBox: { marginTop: 10, padding: 10, backgroundColor: '#FEFBF8', borderRadius: 8 },
  upgradeDetailTitle: { color: '#059669', fontWeight: '700' },
  upgradeDetailFinalPrice: { marginTop: 6, fontSize: 18, color: '#A0522D', fontWeight: '800' },
  upgradeDetailProration: { fontSize: 12, color: '#6B7280' },
});

export default UpgradePlanScreen;
