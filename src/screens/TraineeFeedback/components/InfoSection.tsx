import { Text, View } from 'react-native';
import InfoRow from './InfoRow';
import { colors } from '../../../theme/colors';
import { infoType } from '../useTraineeFeedback';

type Props = {
  info: infoType;
};

const InfoSection = ({ info }: Props) => {
  return (
    <View
      className="mx-4 p-4 rounded-lg bg-background-sub2"
      style={{ borderLeftWidth: 10, borderLeftColor: colors.foreground }}
    >
      {/* Course Name */}
      <Text className="color-foreground text-center font-semibold text-lg">
        {info.course_name}
      </Text>

      <View className="flex-row justify-between gap-4 flex-wrap items-center mt-4">
        {/* Number of week */}
        <InfoRow
          label="Số tuần"
          value={info.number_of_week.toString()}
          iconName="calendar-outline"
          iconSize={20}
        />

        {/* Duration */}
        <InfoRow
          label="Thời lượng"
          value={info.duration}
          iconName="time-outline"
          iconSize={20}
        />

        {/* Number of lesson */}
        <InfoRow
          label="Bài học"
          value={info.number_of_lesson.toString()}
          iconName="receipt-outline"
          iconSize={20}
        />

        {/* Level */}
        <InfoRow
          label="Cấp độ"
          value={info.level}
          iconName="cellular"
          iconSize={20}
        />
      </View>
    </View>
  );
};

export default InfoSection;
