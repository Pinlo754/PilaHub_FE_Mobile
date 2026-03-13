import { Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "@react-native-vector-icons/ionicons";
import { colors } from "../../../theme/colors";

type Props = {
  strengths?: string;
  weaknesses?: string;
  recommendations?: string;
};

const parseMarkdown = (text?: string) => {
  if (!text) return [];

  return text
    .split("\n")
    .map((line) => line.replace(/[-*]/g, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);
};

const Section = ({
  title,
  icon,
  color,
  items,
}: {
  title: string;
  icon: string;
  color: string;
  items: string[];
}) => {
  if (!items.length) return null;

  return (
    <View className="mt-4">
      {/* Header */}
      <View className="flex-row items-center mb-2">
        <Ionicons name={icon as any} size={20} color={color} />
        <Text className="ml-2 font-semibold text-base text-foreground">
          {title}
        </Text>
      </View>

      {/* Content */}
      <View className="bg-background-sub1/30 rounded-xl p-3 gap-2">
        {items.map((item, index) => (
          <View key={index} className="flex-row items-start">
            <Ionicons
              name="ellipse"
              size={8}
              color={color}
              style={{ marginTop: 7 }}
            />
            <Text className="ml-2 text-sm text-foreground flex-1 leading-5">
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const AdviceSection = ({
  strengths,
  weaknesses,
  recommendations,
}: Props) => {
  const strengthList = parseMarkdown(strengths);
  const weaknessList = parseMarkdown(weaknesses);
  const recommendList = parseMarkdown(recommendations);

  return (
    <View className="m-4 border border-info-darker/20 rounded-xl overflow-hidden shadow-md elevation-md">
      <LinearGradient
        colors={[colors.info.lighter, "#FFF"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ padding: 16 }}
      >
        {/* Header */}
        <View className="flex-row items-center mb-2">
          <View className="w-10 h-10 rounded-full bg-info-darker items-center justify-center">
            <Ionicons name="sparkles" size={20} color="#FFF" />
          </View>

          <Text className="ml-2 text-lg font-bold text-foreground">
            Phân tích từ AI
          </Text>
        </View>

        {/* Sections */}

        <Section
          title="Điểm mạnh"
          icon="checkmark-circle"
          color={colors.success.DEFAULT}
          items={strengthList}
        />

        <Section
          title="Cần cải thiện"
          icon="alert-circle"
          color={colors.warning.DEFAULT}
          items={weaknessList}
        />

        <Section
          title="Lời khuyên luyện tập"
          icon="fitness"
          color={colors.info.darker}
          items={recommendList}
        />
      </LinearGradient>
    </View>
  );
};

export default AdviceSection;