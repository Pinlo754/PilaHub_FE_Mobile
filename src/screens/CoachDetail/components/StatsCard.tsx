import { Text, View } from 'react-native';

type Props = {
  rate: number;
  experienceYears: number;
};

const StatsCard = ({ rate, experienceYears }: Props) => {
  return (
    <View className="absolute mx-10 self-center top-[310px] bg-background-sub2 rounded-lg py-3 flex-row items-center shadow-md elevation-md">
      {/* Rate */}
      <View className="w-[50%] py-1 items-center border-r-2 border-background-sub1">
        <Text className="color-foreground text-xl font-bold">{rate}</Text>
        <Text className="color-secondaryText">Đánh giá</Text>
      </View>

      {/* Experience */}
      <View className="w-[50%] items-center">
        <Text className="color-foreground text-xl font-bold">
          {experienceYears}
        </Text>
        <Text className="color-secondaryText">Năm kinh nghiệm</Text>
      </View>
    </View>
  );
};

export default StatsCard;
