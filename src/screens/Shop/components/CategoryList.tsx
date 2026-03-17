import React from 'react';
import { View, Text, FlatList, Pressable, Image } from 'react-native';
import { CategoryItem } from '../../../services/products';

export default function CategoryList({ data, onPressCategory }: { data: CategoryItem[]; onPressCategory?: (c: CategoryItem) => void }) {
  return (
    <View className="mt-4 px-4">
      <Text className="color-foreground font-semibold mb-2">Danh mục</Text>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => onPressCategory?.(item)} className="mr-3 items-center">
            <View className="w-16 h-16 rounded-xl bg-pink-50 items-center justify-center overflow-hidden">
              {item.icon ? (
                <Image source={{ uri: item.icon }} className="w-9 h-9" />
              ) : (
                <View className="w-9 h-9 rounded-full bg-pink-200" />
              )}
            </View>
            <Text className="text-xs mt-1 text-center w-20">{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
