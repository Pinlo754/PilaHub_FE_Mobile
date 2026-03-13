import { Pressable, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { ErrorItemType } from '../../../utils/SummaryType';
import ErrorExpandContent from './ErrorExpandContent';
import { colors } from '../../../theme/colors';
import { secondsToTime } from '../../../utils/time';

type Props = {
  item: ErrorItemType;
  expanded: boolean;
  onPress: () => void;
  onPlayVideo: (src: string) => void;
};

const ErrorItem = ({ item, expanded, onPress, onPlayVideo }: Props) => {
  return (
    <View className="mb-3">
      <Pressable
        onPress={onPress}
        className="bg-white border border-background-sub2 rounded-full px-4 py-3 flex-row items-center justify-between shadow elevation"
      >
        {/* Title */}
        <Text className="color-foreground text-lg font-medium">
          {item.title}
        </Text>

        {/* Time */}
        <View className="flex-row items-center">
          <View className="bg-background-sub2 px-2 py-1 rounded mr-2">
            <Text className="text-secondaryText font-semibold">
              {secondsToTime(item.time)}
            </Text>
          </View>

          {/* Arrow */}
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color={colors.foreground}
          />
        </View>
      </Pressable>

      {/* Expand Content */}
      {expanded && <ErrorExpandContent item={item} onPlayVideo={onPlayVideo} />}
    </View>
  );
};

export default ErrorItem;
