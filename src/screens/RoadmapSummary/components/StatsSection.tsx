import { View } from 'react-native';
import CardStat from './CardStat';
import { colors } from '../../../theme/colors';

const StatsSection = () => {
  return (
    <View className="mt-4 bg-[#FFF7ED] p-4">
      <View className="flex-row flex-wrap justify-between gap-2">
        <CardStat
          title="Độ chính xác"
          value="80"
          progress={80}
          change={8}
          trend="up"
          colorIcon={colors.info.darker}
          colorBg={colors.info[20]}
          iconName="speedometer"
          iconSize={18}
          isPercent={true}
        />

        <CardStat
          title="Tư thế"
          value="80"
          progress={80}
          change={8}
          trend="up"
          colorIcon={colors.orange.DEFAULT}
          colorBg={colors.orange[20]}
          iconName="accessibility"
          iconSize={18}
          isPercent={true}
        />

        <CardStat
          title="Hơi thở"
          value="80"
          progress={80}
          change={8}
          trend="down"
          colorIcon={colors.warning.DEFAULT}
          colorBg={colors.warning[20]}
          iconName="pulse"
          iconSize={18}
          isPercent={false}
        />

        <CardStat
          title="Linh hoạt"
          value="80%"
          progress={80}
          change={8}
          trend="down"
          colorIcon={colors.purple.DEFAULT}
          colorBg={colors.purple[20]}
          iconName="flame"
          iconSize={18}
          isPercent={true}
        />
      </View>
    </View>
  );
};

export default StatsSection;
