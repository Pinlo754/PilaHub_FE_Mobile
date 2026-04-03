import React from 'react';
import { Text, Image, TouchableOpacity } from 'react-native';
import { ProductItem } from '../../../services/products';
import { normalizeImageUrl } from '../../../services/products';
import { formatVND } from '../../../utils/number';

type Props = { item: ProductItem; onPress?: (p: ProductItem) => void };

const SuggestedProductItem = ({ item, onPress }: Props) => {
  return (
    <TouchableOpacity className="w-30 mr-3" onPress={() => onPress?.(item)}>
      <Image source={{ uri: normalizeImageUrl(item.thumbnailUrl ?? item.thumnail_url ?? item.imageUrl) }} className="w-30 h-20 rounded-md bg-gray-100" />
      <Text numberOfLines={1} className="mt-2 text-sm text-[#0F172A]">{item.name}</Text>
      <Text className="mt-1 font-bold text-teal-500">{formatVND(item.price ?? 0)}</Text>
    </TouchableOpacity>
  );
};

export default SuggestedProductItem;
