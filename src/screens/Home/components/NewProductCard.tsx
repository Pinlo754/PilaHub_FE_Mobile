import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { colors } from '../../../theme/colors';
import { ProductItem } from '../../../services/products';

type Props = {
  item: ProductItem;
  onPress?: () => void;
  onAddPress?: () => void;
};

const formatPrice = (price?: number) => {
  if (!price) return '0đ';
  return `${Number(price).toLocaleString('vi-VN')}đ`;
};

const getImageUrl = (item: ProductItem) => {
  return item.thumbnailUrl || item.thumnail_url || item.imageUrl || '';
};

const NewProductCard = ({ item, onPress, onAddPress }: Props) => {
  const imageUri = getImageUrl(item);

  const stock = item.stockQuantity ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;

  return (
    <Pressable
      onPress={onPress}
      className="w-[180px] rounded-3xl bg-white overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }}
    >
      {/* Image */}
      <View className="relative h-[145px] bg-[#F8F8F8] items-center justify-center">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="w-full h-full"
            resizeMode="contain"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons
              name="image-outline"
              size={34}
              color={colors.secondaryText}
            />
          </View>
        )}

        {item.installationSupported ? (
          <View className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-emerald-500">
            <Text className="text-white text-xs font-bold">Lắp đặt</Text>
          </View>
        ) : null}

        {isLowStock || isOutOfStock ? (
          <View
            className={`absolute top-3 right-3 px-3 py-1.5 rounded-full ${
              isOutOfStock ? 'bg-red-500' : 'bg-orange-500'
            }`}
          >
            <Text className="text-white text-xs font-bold">
              {isOutOfStock ? 'Hết hàng' : 'Sắp hết'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Content */}
      <View className="p-3">
        <Text
          numberOfLines={2}
          className="text-[15px] font-bold text-foreground leading-5 min-h-[40px]"
        >
          {item.name}
        </Text>

        <View className="flex-row items-center mt-2">
          <Ionicons name="star" size={16} color="#FFB000" />

          <Text className="ml-1 text-sm font-semibold text-foreground">
            {item.avgRating ?? 0}
          </Text>

          <Text className="ml-1 text-sm text-secondaryText">
            ({item.reviewCount ?? 0})
          </Text>
        </View>

        <Text
          numberOfLines={1}
          className="mt-2 text-[20px] font-extrabold text-orange-600"
        >
          {formatPrice(item.price)}
        </Text>

        <View className="flex-row items-center gap-2 mt-3">
          <View className="flex-row items-center px-3 py-2 rounded-full bg-emerald-50">
            <Ionicons name="cube-outline" size={15} color="#059669" />

            <Text className="ml-1 text-xs font-bold text-emerald-700">
              Còn {stock}
            </Text>
          </View>

          <View
            className={`w-9 h-9 rounded-full items-center justify-center ${
              isOutOfStock
                ? 'bg-red-100'
                : isLowStock
                  ? 'bg-orange-100'
                  : 'bg-emerald-50'
            }`}
          >
            <Ionicons
              name={
                isOutOfStock || isLowStock
                  ? 'warning-outline'
                  : 'checkmark-outline'
              }
              size={17}
              color={
                isOutOfStock
                  ? '#DC2626'
                  : isLowStock
                    ? '#F97316'
                    : '#059669'
              }
            />
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-4">
          <Text
            numberOfLines={1}
            className="flex-1 mr-2 text-sm text-secondaryText"
          >
            {item.vendorBusinessName || 'Cửa hàng'}
          </Text>

         
        </View>
      </View>
    </Pressable>
  );
};

export default NewProductCard;