import { View } from 'react-native';
import CardStat from './CardStat';
import { colors } from '../../../theme/colors';

const StatsSection = () => {
  return (
    <View className="mt-4 p-4">
      <View className="flex-row flex-wrap justify-between gap-2">
        <CardStat
          title="Thời gian"
          value="30:00"
          colorIcon={colors.info.darker}
          colorBg={colors.info[20]}
          iconName="time"
          iconSize={26}
        />

        <CardStat
          title="Calo"
          value="~342"
          colorIcon={colors.danger.DEFAULT}
          colorBg={colors.danger[20]}
          iconName="flame"
          iconSize={26}
        />

        <CardStat
          title="Động tác"
          value="12/12"
          colorIcon={colors.warning.DEFAULT}
          colorBg={colors.warning[20]}
          iconName="accessibility"
          iconSize={24}
        />

        <CardStat
          title="Độ chính xác"
          value="80%"
          colorIcon={colors.purple.DEFAULT}
          colorBg={colors.purple[20]}
          iconName="speedometer"
          iconSize={24}
        />
      </View>
    </View>
  );
};

export default StatsSection;
