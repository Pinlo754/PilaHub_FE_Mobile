import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import RoadmapApi from '../../hooks/roadmap.api';
import { useCart } from '../../context/CartContext';
import { formatVND } from '../../utils/number';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

// SmallCard moved outside to avoid defining inside render
function SmallCard({ item, onPress, onBuy }: { item: any; onPress: (i: any) => void; onBuy: (i: any) => void }) {
  const price = item.price ?? item.raw?.price ?? 0;

  return (
    <TouchableOpacity onPress={() => onPress(item)} className="w-56 mr-4">
      <View className="bg-white rounded-xl overflow-hidden shadow-sm">
        <Image
          source={(item.image || item.raw?.thumbnailUrl || item.raw?.thumnail_url) ? { uri: item.image ?? item.raw?.thumbnailUrl ?? item.raw?.thumnail_url } : { uri: 'https://via.placeholder.com/480x300.png?text=No+Image' }}
          className="w-56 h-40 bg-[#f1f5f9]"
        />
        <View className="p-3">
          <Text className="font-semibold text-base text-foreground mb-1" numberOfLines={2}>{item.name}</Text>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="font-extrabold text-amber-600 text-lg">{price > 0 ? formatVND(price) : 'Liên hệ'}</Text>
            <TouchableOpacity onPress={() => onBuy(item)} className="bg-amber-500 px-3 py-2 rounded-lg">
              <Text className="text-white text-sm font-bold">Thêm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RoadmapProductsScreen() {
  const [loading, setLoading] = useState(true);
  const [equipmentByStage, setEquipmentByStage] = useState<Record<string, any>>({});
  const [supplementsByStage, setSupplementsByStage] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const navigation = useNavigation<any>();

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
          setEquipmentByStage({});
          setSupplementsByStage({});
          return;
        }

        const roadmapId = roadmap?.id ?? roadmap?.roadmapId ?? roadmap?._id ?? null;
        if (!roadmapId) {
          setError('Lộ trình không có id hợp lệ.');
          setEquipmentByStage({});
          setSupplementsByStage({});
          return;
        }

        const [eqRes, supRes] = await Promise.allSettled([
          RoadmapApi.getProductEquipments(roadmapId),
          RoadmapApi.getProductSupplements(roadmapId),
        ]);

        const equipmentRaw = eqRes.status === 'fulfilled' ? (Array.isArray(eqRes.value) ? eqRes.value : []) : [];
        const supplementsRaw = supRes.status === 'fulfilled' ? (Array.isArray(supRes.value) ? supRes.value : []) : [];

        // prepare stage keys from server stages; fallback to single 'all' stage
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

        // helper to compute stageKey for item
        const computeStageKey = (it: any) => {
          if (it == null) return 'unassigned';
          if (it.stageOrder != null) return String(it.stageOrder);
          if (it.stage_order != null) return String(it.stage_order);
          if (it.stageId != null) return String(it.stageId);
          if (it.stage_id != null) return String(it.stage_id);
          if (it.stage && (it.stage.stageOrder != null || it.stage.stage_order != null)) return String(it.stage.stageOrder ?? it.stage.stage_order);
          return 'unassigned';
        };

        // init maps
        const equipmentMap: Record<string, any[]> = {};
        const supplementMap: Record<string, any[]> = {};
        // ensure keys exist
        keys.forEach(k => { equipmentMap[k.key] = []; supplementMap[k.key] = []; });
        equipmentMap.unassigned = [];
        supplementMap.unassigned = [];

        // normalize and group
        equipmentRaw.forEach((e: any, idx: number) => {
          // expect product DTO from /products/roadmaps/{id}/equipments
          const pid = e.productId ?? e.product_id ?? e.id ?? `eq-${idx}`;
          const item = {
            id: pid,
            productId: pid,
            name: e.name ?? e.product_name ?? e.title ?? 'Dụng cụ',
            image: e.thumbnailUrl ?? e.thumnail_url ?? e.imageUrl ?? e.thumbnail ?? null,
            price: e.price ?? e.retailPrice ?? e.priceVND ?? e.price_vnd ?? null,
            raw: e,
          };
          const sk = computeStageKey(e);
          if (equipmentMap[sk]) equipmentMap[sk].push(item);
          else equipmentMap.unassigned.push(item);
        });

        supplementsRaw.forEach((s: any, idx: number) => {
          // expect product DTO from /products/roadmaps/{id}/supplements
          const pid = s.productId ?? s.product_id ?? s.id ?? `sup-${idx}`;
          const item = {
            id: pid,
            productId: pid,
            name: s.name ?? s.product_name ?? s.title ?? 'Sản phẩm bổ sung',
            image: s.thumbnailUrl ?? s.thumnail_url ?? s.imageUrl ?? s.thumbnail ?? null,
            price: s.price ?? s.retailPrice ?? s.priceVND ?? s.price_vnd ?? null,
            raw: s,
          };
          const sk = computeStageKey(s);
          if (supplementMap[sk]) supplementMap[sk].push(item);
          else supplementMap.unassigned.push(item);
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

  const handleBuy = async (item: any) => {
    try {
      const price = (typeof item.price === 'number' && !Number.isNaN(item.price)) ? item.price : (item.raw?.price ?? 0);

      const cartItem = {
        product_id: item.productId ?? item.id ?? `item-${Date.now()}`,
        product_name: item.name ?? 'Sản phẩm',
        thumnail_url: item.image ?? null,
        price: price,
        raw: item.raw ?? item,
      } as any;
      await addToCart(cartItem, 1);
      Alert.alert('Thành công', 'Đã thêm vào giỏ hàng');
    } catch (e: any) {
      console.warn('addToCart failed', e);
      Alert.alert('Lỗi', 'Không thể thêm sản phẩm vào giỏ');
    }
  };

  const openDetail = (item: any) => {
    const candidateId = item.productId ?? item.id ?? item.raw?.productId ?? item.raw?.product_id ?? item.raw?.id;
    if (candidateId) {
      navigation.navigate('ProductDetail' as any, { productId: candidateId });
    } else {
      Alert.alert(item.name ?? 'Sản phẩm', JSON.stringify(item.raw ?? item, null, 2), [{ text: 'Đóng' }]);
    }
  };

  if (loading) return (
    <SafeAreaView className="flex-1 bg-[#FFF8F0]">
      <View className="px-3 py-3 border-b border-[#F3F4F6] bg-[#FFF8F0]">
        <Text className="text-lg font-extrabold text-[#0F172A]">Sản phẩm của lộ trình</Text>
      </View>
      <View className="flex-1 justify-center items-center"><ActivityIndicator /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FFF8F0]">
      <View className="px-3 py-3 border-b border-[#F3F4F6] bg-[#FFF8F0] flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3 p-1">
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-[#0F172A]">Sản phẩm của lộ trình</Text>
      </View>

      {error ? (
        <View className="flex-1 justify-center items-center"><Text>{error}</Text></View>
      ) : (
        <View className="p-3">
          {/* Unassigned items */}
          {((equipmentByStage.unassigned ?? []).length > 0 || (supplementsByStage.unassigned ?? []).length > 0) ? (
            <View className="mt-6">
              {(equipmentByStage.unassigned ?? []).length > 0 ? (
                <>
                  <Text className="text-sm font-semibold text-[#374151] mb-2">Thiết bị tập luyện</Text>
                  <FlatList
                    data={equipmentByStage.unassigned}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(i) => i.id}
                    renderItem={({ item }) => <SmallCard item={item} onPress={openDetail} onBuy={handleBuy} />}
                  />
                </>
              ) : null}

              {(supplementsByStage.unassigned ?? []).length > 0 ? (
                <>
                  <Text className="text-sm font-semibold text-[#374151] mt-3 mb-2">Thực phẩm chức năng</Text>
                  <FlatList
                    data={supplementsByStage.unassigned}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(i) => i.id}
                    renderItem={({ item }) => <SmallCard item={item} onPress={openDetail} onBuy={handleBuy} />}
                  />
                </>
              ) : null}
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}
