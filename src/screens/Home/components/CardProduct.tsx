import React, { useState } from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { ProductType } from '../../../utils/ProductType';
import { formatVND } from '../../../utils/number';
import Ionicons from '@react-native-vector-icons/ionicons';
import placeholderThumb from '../../../assets/placeholderAvatar.png';
import { useCart } from '../../../context/CartContext';
import { normalizeImageUrl } from '../../../services/products';
import Toast from '../../../components/Toast';

type Props = {
  item: ProductType | any;
  
  onPress: () => void;
};

const CardProduct = ({ item, onPress }: Props) => {
  const { addToCart } = useCart();
  const rating = item.raw?.avgRating ?? item.avgRating ?? 0;
  const reviewCount = item.raw?.reviewCount ?? item.reviewCount ?? 0;

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success'|'error'|'info'>('success');

  const onBuy = async () => {
    try {
      await addToCart({
        product_id: item.productId ?? item.product_id ?? item.raw?.product_id,
        product_name: item.name ?? item.product_name,
        thumnail_url: normalizeImageUrl(item.thumbnailUrl ?? item.thumnail_url ?? item.imageUrl),
        price: item.price ?? 0,
        raw: item.raw,
      }, 1);
      setToastMsg('Đã thêm vào giỏ hàng'); setToastType('success'); setToastVisible(true);
    } catch (e) {
      console.warn('addToCart from CardProduct failed', e);
      setToastMsg('Không thể thêm vào giỏ'); setToastType('error'); setToastVisible(true);
    }
  };

  return (
    <>
      <Pressable
        className="bg-white rounded-xl overflow-hidden shadow-lg"
        onPress={onPress}
        style={localStyles.card}
      >
        {item.installationSupported ? (
          <View style={localStyles.badgeWrap} className="absolute top-2 left-2 z-10 bg-green-700 rounded-full px-3 py-1">
            <Text className="text-white text-xs font-bold">Hỗ trợ lắp đặt</Text>
          </View>
        ) : null}
        <View className="h-[180px] bg-gray-100">
          <Image
            source={(item.thumbnailUrl || item.thumnail_url || item.imageUrl) ? { uri: normalizeImageUrl(item.thumbnailUrl ?? item.thumnail_url ?? item.imageUrl) } : (placeholderThumb as any)}
            style={localStyles.thumb}
            resizeMode="cover"
          />
        </View>
        <View className="p-4">
          <Text className="text-[#0F172A] font-semibold line-clamp-2 text-base">{item.name ?? item.product_name}</Text>

          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-teal-500 text-xl font-extrabold">{formatVND(item.price ?? 0)}</Text>
            <View className="flex-row items-center">
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text className="ml-1 text-sm text-gray-600">{Number(rating).toFixed(1)}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-xs text-gray-500">Đã bán: {reviewCount}</Text>
            <Pressable onPress={onBuy} className="bg-orange-500 px-4 py-2 rounded-lg">
              <Text className="text-white font-bold text-sm">Thêm</Text>
            </Pressable>
          </View>
          {/* installation badge handled via badgeWrap; no extra install note */}
        </View>
      </Pressable>

      <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />
    </>
  );
};

const localStyles = StyleSheet.create({
  // fixed card height so two-column grid renders uniform cards
  card: { width: '100%', height: 360, justifyContent: 'space-between' },
  thumb: { width: '100%', height: 180, backgroundColor: '#f1f5f9' },
  badgeWrap: { position: 'absolute', top: 8, left: 8, zIndex: 10 },
});

export default CardProduct;
