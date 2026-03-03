import { View, TouchableOpacity, Text } from "react-native";

export default function StageSelector({
  stages,
  selectedIndex,
  onSelect,
}: any) {
  return (
    <View className="flex-row justify-center mt-4 mb-3">
      {stages.map((stage: any, index: number) => (
        <TouchableOpacity
          key={index}
          onPress={() => onSelect(index)}
          className={`px-4 py-2 rounded-full mx-2 ${
            selectedIndex === index
              ? "bg-[#8B4513]"
              : "bg-[#E5D5C3]"
          }`}
        >
          <Text
            className={`${
              selectedIndex === index
                ? "text-white font-semibold"
                : "text-black"
            }`}
          >
            {stage.stageName}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}