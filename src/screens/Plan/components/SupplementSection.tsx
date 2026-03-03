import { View, Text, Image } from "react-native";

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
          className="bg-white mx-5 mt-3 p-4 rounded-2xl shadow flex-row"
        >
          {s.imageUrl ? (
            <Image
              source={{ uri: s.imageUrl }}
              style={{ width: 64, height: 64, borderRadius: 8, marginRight: 12 }}
              resizeMode="cover"
            />
          ) : null}

          <View style={{ flex: 1 }}>
            <Text className="font-bold">
              {s.supplementName}
            </Text>
            <Text className="text-gray-500 mt-1">
              {s.reason}
            </Text>
            {s.recommendedTiming ? (
              <Text className="text-sm text-gray-400 mt-2">Thời điểm: {s.recommendedTiming}</Text>
            ) : null}
            {s.dosage ? (
              <Text className="text-sm text-gray-400">Liều lượng: {s.dosage}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}