import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
type Props = {
  title: string;
  description?: string;
};

export default function IconInfo({ title, description }: Props) {
  const [show, setShow] = useState(false);

  return (
    <View className="bg-white mt-2 rounded-xl p-4 border border-gray-100 shadow-sm">

      {/* Title + Help icon */}
      <View className="flex-row items-center justify-between">
        
        <Text className="text-base font-semibold text-gray-800 flex-1 pr-2">
          {title}
        </Text>

        <Pressable
          onPress={() => setShow(!show)}
          className="w-7 h-7 items-center justify-center rounded-full bg-gray-100"
        >
          <Ionicons name="help-circle-outline" size={18} color="#6B7280" />
        </Pressable>

      </View>

      {/* Description */}
      {show && description && (
        <View className="mt-3 bg-gray-50 p-3 rounded-lg">
          <Text className="text-sm text-gray-600">
            {description}
          </Text>
        </View>
      )}

    </View>
  );
}
