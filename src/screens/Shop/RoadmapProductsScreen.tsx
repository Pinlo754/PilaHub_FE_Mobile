import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import RoadmapApi from '../../hooks/roadmap.api';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import Toast from '../../components/Toast';
import CardProduct from '../Home/components/CardProduct';
import { ProductItem } from '../../services/products';

const CARD_WIDTH = Dimensions.get('window').width * 0.55;

function CarouselSection({
  title,
  data,
  onPress,
  onNotify,
}: {
  title: string;
  data: any[];
  onPress: (item: any) => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}) {
  if (data.length === 0) return null;

  return (
    <View style={styles.section}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{data.length} sản phẩm</Text>
      </View>

      {/* Horizontal carousel */}
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.productId ?? item.id}-${index}`}
        contentContainerStyle={styles.carouselContent}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <CardProduct
              item={item as any}
              onPress={() => onPress(item)}
              onNotify={onNotify}
            />
          </View>
        )}
      />
    </View>
  );
}

export default function RoadmapProductsScreen() {
  const [loading, setLoading] = useState(true);
  const [equipmentByStage, setEquipmentByStage] = useState<Record<string, any[]>>({});
  const [supplementsByStage, setSupplementsByStage] = useState<Record<string, any[]>>({});
  const [error, setError] = useState<string | null>(null);
  const { totalItems } = useCart();
  const navigation = useNavigation<any>();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const newest = await RoadmapApi.getNewest();
        const roadmap = newest?.roadmap ?? newest ?? null;
        const stagesFromServer = newest?.stages ?? [];

        if (!roadmap) {
          setError('Không tìm thấy lộ trình cho người dùng hiện tại.');
          return;
        }

        const roadmapId = roadmap?.id ?? roadmap?.roadmapId ?? roadmap?._id ?? null;
        if (!roadmapId) {
          setError('Lộ trình không có id hợp lệ.');
          return;
        }

        const [eqRes, supRes] = await Promise.allSettled([
          RoadmapApi.getProductEquipments(roadmapId),
          RoadmapApi.getProductSupplements(roadmapId),
        ]);

        const equipmentRaw = eqRes.status === 'fulfilled' ? (Array.isArray(eqRes.value) ? eqRes.value : []) : [];
        const supplementsRaw = supRes.status === 'fulfilled' ? (Array.isArray(supRes.value) ? supRes.value : []) : [];

        const keys: { key: string; title: string }[] = [];
        if (Array.isArray(stagesFromServer) && stagesFromServer.length > 0) {
          stagesFromServer.forEach((s: any, idx: number) => {
            const key = String(s.stageOrder ?? s.stage_order ?? (idx + 1));
            const title = s.stageName ?? s.name ?? `Giai đoạn ${idx + 1}`;
            keys.push({ key, title });
          });
        } else {
          keys.push({ key: 'all', title: 'Tất cả' });
        }

        const computeStageKey = (it: any) => {
          if (it == null) return 'unassigned';
          if (it.stageOrder != null) return String(it.stageOrder);
          if (it.stage_order != null) return String(it.stage_order);
          if (it.stageId != null) return String(it.stageId);
          if (it.stage_id != null) return String(it.stage_id);
          if (it.stage && (it.stage.stageOrder != null || it.stage.stage_order != null))
            return String(it.stage.stageOrder ?? it.stage.stage_order);
          return 'unassigned';
        };

        const normalizeItem = (raw: any, idx: number, prefix: string): ProductItem => {
          const pid = raw.productId ?? raw.product_id ?? raw.id ?? `${prefix}-${idx}`;
          return {
            id: pid,
            productId: pid,
            name: raw.name ?? raw.product_name ?? raw.title ?? 'Sản phẩm',
            image: raw.thumbnailUrl ?? raw.thumnail_url ?? raw.imageUrl ?? raw.thumbnail ?? null,
            price: raw.price ?? raw.retailPrice ?? raw.priceVND ?? raw.price_vnd ?? 0,
            raw,
          } as any;
        };

        const equipmentMap: Record<string, any[]> = {};
        const supplementMap: Record<string, any[]> = {};
        keys.forEach(k => { equipmentMap[k.key] = []; supplementMap[k.key] = []; });
        equipmentMap.unassigned = [];
        supplementMap.unassigned = [];

        equipmentRaw.forEach((e: any, idx: number) => {
          const item = normalizeItem(e, idx, 'eq');
          const sk = computeStageKey(e);
          (equipmentMap[sk] ?? equipmentMap.unassigned).push(item);
        });

        supplementsRaw.forEach((s: any, idx: number) => {
          const item = normalizeItem(s, idx, 'sup');
          const sk = computeStageKey(s);
          (supplementMap[sk] ?? supplementMap.unassigned).push(item);
        });

        if (mounted) {
          setEquipmentByStage(equipmentMap);
          setSupplementsByStage(supplementMap);
          setError(null);
        }
      } catch (e: any) {
        console.warn('RoadmapProducts load error', e);
        if (mounted) setError('Không thể tải sản phẩm lộ trình');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const openDetail = (item: any) => {
    const candidateId = item.productId ?? item.id ?? item.raw?.productId ?? item.raw?.product_id ?? item.raw?.id;
    if (candidateId) {
      navigation.navigate('ProductDetail' as any, { productId: candidateId });
    } else {
      Alert.alert(item.name ?? 'Sản phẩm', JSON.stringify(item.raw ?? item, null, 2), [{ text: 'Đóng' }]);
    }
  };

  const NavHeader = () => (
    <View style={styles.navHeader}>
      <View style={styles.navLeft}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Sản phẩm của lộ trình</Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('Cart' as any)} style={styles.cartBtn}>
        <Ionicons name="cart-outline" size={24} color="#0F172A" />
        {totalItems > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <NavHeader />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#CD853F" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        <NavHeader />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#CD853F" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const equipmentItems = equipmentByStage.unassigned ?? [];
  const supplementItems = supplementsByStage.unassigned ?? [];
  const hasContent = equipmentItems.length > 0 || supplementItems.length > 0;

  return (
    <SafeAreaView style={styles.screen}>
      <NavHeader />

      {!hasContent ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={48} color="#CD853F" />
          <Text style={styles.emptyText}>Chưa có sản phẩm nào trong lộ trình</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <CarouselSection
            title="Thiết bị tập luyện"
            data={equipmentItems}
            onPress={openDetail}
            onNotify={showToast}
          />
          <CarouselSection
            title="Thực phẩm chức năng"
            data={supplementItems}
            onPress={openDetail}
            onNotify={showToast}
          />
        </ScrollView>
      )}

      <Toast
        visible={toastVisible}
        message={toastMsg}
        type={toastType}
        onHidden={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFF8F0',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  cartBtn: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#0F172A',
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },
  emptyText: {
    color: '#0F172A',
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  carouselContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
});