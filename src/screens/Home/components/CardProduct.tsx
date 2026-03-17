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
        product_id: item.product_id,
        product_name: item.product_name,
        thumnail_url: normalizeImageUrl(item.thumnail_url),
        price: item.price,
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
        className="bg-white rounded-xl overflow-hidden shadow-md"
        onPress={onPress}
        style={styles.card}
      >
        <View style={styles.thumbWrap} className="h-[140px] bg-gray-100">
          <Image
            source={item.thumnail_url ? { uri: normalizeImageUrl(item.thumnail_url) } : (placeholderThumb as any)}
            style={styles.thumb}
            resizeMode="cover"
          />
        </View>
        <View className="p-3">
          <Text className="color-foreground font-medium line-clamp-2">{item.product_name}</Text>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="color-secondaryText text-lg font-bold">{formatVND(item.price)}</Text>
            <View className="flex-row items-center">
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text className="ml-1 text-sm text-gray-600">{Number(rating).toFixed(1)}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xs text-gray-500">Đã bán: {reviewCount}</Text>
            <Pressable onPress={onBuy} style={styles.buyBtn}>
              <Text style={styles.buyBtnText}>Mua</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>

      <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  card: { width: '100%' },
  thumbWrap: { height: 140, backgroundColor: '#f8fafc' },
  thumb: { width: '100%', height: '100%', backgroundColor: '#f1f5f9' },
  buyBtn: { backgroundColor: '#F97316', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  buyBtnText: { color: '#fff', fontWeight: '700' },
});

export default CardProduct;
