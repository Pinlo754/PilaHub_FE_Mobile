import { View, Text } from "react-native";

export default function SupplementSection({ stage }: any) {
  if (!stage?.supplementRecommendations?.length) return null;

  return (
    <View className="mt-6">
      <Text className="text-lg font-bold mx-5">
        Thực Phẩm Hỗ Trợ
      </Text>

      {stage.supplementRecommendations.map((s: any, i: number) => (
        <View
          key={i}
          className="bg-white mx-5 mt-3 p-4 rounded-2xl shadow"
        >
          <Text className="font-bold">
            {s.supplementName}
          </Text>
          <Text className="text-gray-500 mt-1">
            {s.reason}
          </Text>
        </View>
      ))}
    </View>
  );
}