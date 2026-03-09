import { Pressable, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import ErrorExpandContent from './ErrorExpandContent';
import { colors } from '../../../theme/colors';

type ErrorLog = {
  bodyPart: string;
  side: string;
  recordedAtSecond: number;
};

type Props = {
  item: ErrorLog;
  expanded: boolean;
  onPress: () => void;
  onPlayVideo: (time: number) => void;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
const getBodyPartName = (part: string) => {
  if (part === 'none') return 'Lỗi kỹ thuật';
  return part;
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
          {getBodyPartName(item.bodyPart)} ({item.side})
        </Text>

        {/* Time */}
        <View className="flex-row items-center">
          <View className="bg-background-sub2 px-2 py-1 rounded mr-2">
            <Text className="text-secondaryText font-semibold">
              {formatTime(item.recordedAtSecond)}
            </Text>
          </View>

          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color={colors.foreground}
          />
        </View>
      </Pressable>

      {/* Expand Content */}
      {expanded && (
        <ErrorExpandContent
          item={item}
          onPlayVideo={onPlayVideo}
        />
      )}
    </View>
  );
};

export default ErrorItem;