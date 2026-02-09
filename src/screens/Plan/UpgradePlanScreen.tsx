import React, { useRef, useState } from 'react';
import { View, Text,  TouchableOpacity, Animated, Dimensions, StyleSheet, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const PLANS = [
  { id: 'basic', title: 'AI Basic', price: '99,000', desc: 'Gói cơ bản hỗ trợ lịch tập hàng ngày', bullets: ['Gợi ý bài tập', 'Theo dõi tiến độ'] },
  { id: 'pro', title: 'AI Pro', price: '399,000', desc: 'Gói chuyên sâu với phân tích nâng cao', bullets: ['Phân tích AI', 'Chế độ dinh dưỡng', 'Ưu tiên hỗ trợ'] },
  { id: 'premium', title: 'AI Premium', price: '699,000', desc: 'Trọn gói cao cấp cho kết quả tốt nhất', bullets: ['Huấn luyện cá nhân', 'Kế hoạch dài hạn'] },
];

const Card: React.FC<{ plan: any; index: number; onPress: () => void; selected: boolean }> = ({ plan, index: _index, onPress, selected }) => {
  const anim = useRef(new Animated.Value(0)).current; // 0 = normal, 1 = expanded

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: selected ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selected, anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1] });

  return (
    <Animated.View style={[{ width: width * 0.68 }, { transform: [{ scale }, { translateY }], opacity }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} className="bg-white rounded-lg p-4" style={styles.card}>
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-bold">{plan.title}</Text>
          <Text className="text-base font-bold text-[#A0522D]">{plan.price} vnd / tháng</Text>
        </View>

        <Text className="mt-2 text-gray-600">{plan.desc}</Text>

        <View className="mt-3">
          {plan.bullets.map((b: string, i: number) => (
            <View key={i} className="flex-row items-center mb-2">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-3" />
              <Text className="text-gray-700">{b}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const UpgradePlanScreen: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const openDetail = (id: string) => {
    setSelectedId(id);
    Animated.timing(expandAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };
  const closeDetail = () => {
    Animated.timing(expandAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => setSelectedId(null));
  };

  const selectedPlan = PLANS.find(p => p.id === selectedId);

  const detailTranslate = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });
  const backdropOpacity = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });

  // Active card index for tap-to-cycle behavior
  const [activeIndex, setActiveIndex] = useState(0);

  // Animated index for smooth transition
  const animIndex = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(animIndex, { toValue: activeIndex, duration: 300, useNativeDriver: true }).start();
  }, [activeIndex, animIndex]);

  // PanResponder to enable swipe left/right to change active card
  // Use capture handlers so gestures are recognized even when children (Touchable) exist on top
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_evt, gestureState) => {
        const { dx, vx } = gestureState;
        const threshold = 40; // pixels
        const velocityThreshold = 0.2;
        if (dx < -threshold || vx < -velocityThreshold) {
          // swiped left -> next
          setActiveIndex((prev) => (prev + 1) % PLANS.length);
        } else if (dx > threshold || vx > velocityThreshold) {
          // swiped right -> prev
          setActiveIndex((prev) => (prev - 1 + PLANS.length) % PLANS.length);
        }
      },
    })
  ).current;

  const onCardTap = (index: number) => {
    const n = PLANS.length;
    const displayIndex = (index - activeIndex + n) % n; // 0 is active
    if (displayIndex === 0) {
      // tap active -> cycle to next
      setActiveIndex((activeIndex + 1) % n);
    } else {
      // tap non-active -> bring it to active
      setActiveIndex(index);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FEF6ED]">
      <View style={styles.header}>
        <Text className="text-lg font-semibold text-[#A0522D]">Gói nâng cấp AI</Text>
      </View>

      <Text className="text-center mt-2 text-base font-semibold text-[#111]">Lựa chọn gói AI phù hợp với bản thân</Text>

      <View style={styles.stackHolder} {...panResponder.panHandlers}>
        <View style={styles.stackContainer}>
          {PLANS.map((plan, i) => {
             const n = PLANS.length;
             const displayIndex = (i - activeIndex + n) % n; // 0 => active
             const SPACING = 48;
            const cardWidth = width * 0.72;
            const centerLeft = (width - cardWidth) / 2;
             const rotate = animIndex.interpolate({
               inputRange: [i - 2, i - 1, i, i + 1, i + 2],
               outputRange: ['12deg', '6deg', '0deg', '-6deg', '-12deg'],
               extrapolate: 'clamp',
             });
 
             const translateX = animIndex.interpolate({
               inputRange: [i - 2, i - 1, i, i + 1, i + 2],
               outputRange: [SPACING * 2, SPACING, 0, -SPACING, -SPACING * 2],
               extrapolate: 'clamp',
             });
 
             const scale = animIndex.interpolate({
               inputRange: [i - 2, i - 1, i, i + 1, i + 2],
               outputRange: [0.92, 0.96, 1, 0.96, 0.92],
               extrapolate: 'clamp',
             });

             const zIndex = displayIndex === 0 ? 999 : n - displayIndex;

             return (
               <Animated.View
                 key={plan.id}
                 style={[
                   styles.stackCardWrapper,
                   { zIndex, left: centerLeft, width: cardWidth },
                   { transform: [{ translateY: 40 }, { rotate }, { translateY: -40 }, { translateX: translateX }, { scale }] },
                 ]}
               >
                 <TouchableOpacity activeOpacity={0.95} onPress={() => { onCardTap(i); openDetail(plan.id); }}>
                   <Card plan={plan} index={i} onPress={() => {}} selected={displayIndex === 0} />
                 </TouchableOpacity>
               </Animated.View>
             );
           })}
         </View>
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

          <View style={styles.detailList}>
            {selectedPlan?.bullets.map((b, i) => (
              <View key={i} style={styles.detailRow}>
                <View style={styles.detailDot} />
                <Text style={styles.detailText}>{b}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.payButton} onPress={() => { /* thanh toán */ }}>
            <Text style={styles.payButtonText}>Thanh toán</Text>
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
  cardsScroll: { paddingHorizontal: 16, alignItems: 'center' },
  cardContainer: { width: width * 0.68, marginHorizontal: 8 },
  card: { minHeight: 260, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardPrice: { fontSize: 16, color: '#A0522D', fontWeight: '700' },
  cardDesc: { marginTop: 10, color: '#666' },
  bullets: { marginTop: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bulletDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#34D399', marginRight: 8 },
  bulletText: { color: '#333' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  detailSheet: { position: 'absolute', left: 20, right: 20, bottom: 24, backgroundColor: '#fff', borderRadius: 14, padding: 16, maxHeight: height * 0.75, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 12 },
  detailHandle: { width: 40, height: 6, backgroundColor: '#EEE', borderRadius: 6, alignSelf: 'center', marginBottom: 12 },
  detailTitle: { fontSize: 20, fontWeight: '700' },
  detailPrice: { marginTop: 6, fontSize: 20, color: '#A0522D', fontWeight: '700' },
  detailDesc: { marginTop: 8, color: '#666' },
  detailList: { marginTop: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  detailDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#34D399', marginRight: 10 },
  detailText: { color: '#333' },
  payButton: { marginTop: 12, backgroundColor: '#A0522D', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  payButtonText: { color: '#fff', fontWeight: '700' },
  skipButton: { marginTop: 10, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  skipButtonText: { color: '#A0522D', fontWeight: '700' },
  stackContainer: { position: 'relative', width: '100%', height: '100%', alignItems: 'center' },
  stackCardWrapper: { position: 'absolute', top: 0 },
  stackHolder: { height: 360, marginTop: 10, alignItems: 'center' },
});

export default UpgradePlanScreen;
