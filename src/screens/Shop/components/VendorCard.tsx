import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList,StyleSheet } from 'react-native';
import { getVendorById, VendorItem } from '../../../services/vendors';
import { getProducts, ProductItem } from '../../../services/products';
import { normalizeImageUrl } from '../../../services/products';
import Ionicons from '@react-native-vector-icons/ionicons';
import SuggestedProductItem from './SuggestedProductItem';
import { useNavigation } from '@react-navigation/native';

type Props = { vendorId?: string; onPressProduct?: (p: ProductItem) => void };

const VendorCard = ({ vendorId, onPressProduct }: Props) => {
  const [vendor, setVendor] = useState<VendorItem | null>(null);
  const [suggested, setSuggested] = useState<ProductItem[]>([]);
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (!vendorId) return;
    let mounted = true;
    (async () => {
      try {
        const v = await getVendorById(vendorId);
        if (mounted) setVendor(v);
      } catch (e) {
        console.warn('vendor fetch failed', e);
      }
    })();
    return () => { mounted = false; };
  }, [vendorId]);

  useEffect(() => {
    if (!vendorId) return;
    let mounted = true;
    (async () => {
      try {
        const p = await getProducts(0, 6, undefined, { vendorId });
        if (mounted) setSuggested(p.items ?? []);
      } catch (e) {
        console.warn('vendor suggested fetch failed', e);
      }
    })();
    return () => { mounted = false; };
  }, [vendorId]);

  if (!vendor) return null;

  return (
    <View className="mx-4 mt-3 bg-white rounded-xl p-3 shadow-md" style={localStyles.containerShadow}>
      <View className="flex-row items-center">
        <VendorHeader vendor={vendor} onViewShop={() => navigation.navigate('VendorShop' as any, { vendorId: vendor.vendorId })} />
      </View>

      <View className="mt-3">
        <Text className="font-extrabold text-[#0F172A] mb-2">Sản phẩm từ cửa hàng này</Text>
        <FlatList
          data={suggested}
          horizontal
          keyExtractor={(it) => it.productId}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <SuggestedProductItem item={item} onPress={onPressProduct} />
          )}
        />
      </View>
    </View>
  );
};

const VendorHeader = ({ vendor }: { vendor: VendorItem; onViewShop: () => void }) => (
  <>
    <View className="w-14 h-14 rounded-lg overflow-hidden bg-teal-500 items-center justify-center">
      {vendor.logoUrl ? (
        <Image source={{ uri: normalizeImageUrl(vendor.logoUrl) }} className="w-full h-full" />
      ) : (
        <View className="w-full h-full items-center justify-center">
          <Ionicons name="business" size={20} color="#fff" />
        </View>
      )}
    </View>

    <View className="ml-3 flex-1">
      <View className="flex-row items-center">
        <Text className="font-extrabold text-base text-[#0F172A]">{vendor.businessName ?? vendor.name}</Text>
        {vendor.verified ? <Ionicons name="checkmark-circle" size={16} color="#10B981" className="ml-2" /> : null}
      </View>
      <View className="mt-1">
        <Text className="text-sm text-[#64748B]">{vendor.city ? `• ${vendor.city}` : ''}</Text>
      </View>
    </View>

   {/* <TouchableOpacity className="bg-amber-400 px-3 py-2 rounded-lg" onPress={onViewShop}>
       <Text className="text-white font-bold">Xem shop</Text>
    </TouchableOpacity> */}
  </>
);

const localStyles = StyleSheet.create({
  containerShadow: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
});

export default VendorCard;
