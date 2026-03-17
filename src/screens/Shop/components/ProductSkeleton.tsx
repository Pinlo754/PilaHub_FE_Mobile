import React from 'react';
import { View } from 'react-native';

export default function ProductSkeleton({ count = 6 }: { count?: number }) {
  const items = Array.from({ length: count }).map((_, i) => i);

  return (
    <View className="px-4">
      {items.map(i => (
        <View key={i} className="bg-white rounded-xl p-4 mb-4 shadow" >
          <View className="w-full h-36 bg-gray-200 rounded-md" />
          <View className="mt-3 h-4 bg-gray-200 rounded w-1/2" />
          <View className="mt-2 h-4 bg-gray-200 rounded w-1/4" />
        </View>
      ))}
    </View>
  );
}
