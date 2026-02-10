import Ionicons from '@react-native-vector-icons/ionicons';
import { Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import CalendarSection from './CalendarSection';

type Props = {};

const ChooseDaySection = ({}: Props) => {
  return (
    <View className="">
      {/* Header */}
      <View className="mx-4 rounded-full px-3 py-2 bg-background-sub1 flex-row gap-1 items-center">
        {/* Title */}
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={colors.foreground}
        />
        <Text className="color-foreground font-medium flex-grow">
          Hãy chọn ngày <Text className="color-danger-darker">*</Text>
        </Text>

        {/* Number of selected day  */}
        <View className="px-3 py-1 rounded-lg bg-background-sub2 shadow-md elevation-md">
          <Text className="color-secondaryText">1 buổi</Text>
        </View>
      </View>

      {/* Calendar Section */}
      <CalendarSection />
    </View>
  );
};

export default ChooseDaySection;
