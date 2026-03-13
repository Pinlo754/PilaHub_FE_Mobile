import { Pressable, Text, View, Image } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';

type ErrorLog = {
  bodyPart: string;
  side: string;
  recordedAtSecond: number;
  imageUrl: string;
};

type Props = {
  item: ErrorLog;
  onPlayVideo: (time: number) => void;
};

const ErrorExpandContent = ({ item, onPlayVideo }: Props) => {
  return (
    <View className="mt-3 px-2">
      {/* Info Box */}
      <View className="bg-background-sub2 rounded-xl p-4 mb-4">
        <Text className="text-foreground font-semibold text-base mb-1">
          Bộ phận: {item.bodyPart}
        </Text>

        <Text className="text-secondaryText mb-1">
          Bên: {item.side}
        </Text>

        <Text className="text-secondaryText">
          Thời điểm lỗi: {item.recordedAtSecond}s
        </Text>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{
              width: '100%',
              height: 200,
              borderRadius: 12,
              marginTop: 4,
            }}
            resizeMode="cover"
          />
        ) : (
          <Text className="text-secondaryText italic">
            Không có ảnh minh họa
          </Text>
        )}

      </View>

      {/* Play Button */}
      <Pressable
        onPress={() => {
          console.log('played video at', item.recordedAtSecond);
          onPlayVideo(item.recordedAtSecond)
        }}
        className="bg-danger rounded-xl py-3 flex-row justify-center items-center"
      >
        <Ionicons
          name="play-circle-outline"
          size={22}
          color={colors.background.DEFAULT}
        />
        <Text className="text-white font-semibold ml-2">
          Xem lại đoạn lỗi
        </Text>
      </Pressable>
    </View>
  );
};

export default ErrorExpandContent;