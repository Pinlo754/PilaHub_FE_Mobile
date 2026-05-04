import { View } from 'react-native';
import CardStat from './CardStat';
import { colors } from '../../../theme/colors';

type Props = {
  feedback: {
    totalMistakes?: string;
  };
};

const StatsSection = ({ feedback }: Props) => {
  console.log('feedback in stats section', feedback);
  return (
    <View className="mt-4 p-4">
      <View className='w-full'>
        {/* <CardStat
          title="Thời gian"
          value="30:00"
          colorIcon={colors.info.darker}
          colorBg={colors.info[20]}
          iconName="time"
          iconSize={26}
        /> */}

        <CardStat
          title="Tổng số lỗi"
          value={feedback?.totalMistakes ?? '0'}
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