import { Text, TextInput, View } from 'react-native';
import { colors } from '../../../theme/colors';
type Props = {
  comment: string;
  onChange: (text: string) => void;
};

const CommentSection = ({ comment, onChange }: Props) => {
  return (
    <View className="m-4">
      {/* Title */}
      <Text className="color-secondaryText font-semibold text-lg">
        Nhận xét của bạn
      </Text>

      {/* Comment */}
      <View className="border border-foreground rounded-lg px-1 mt-3">
        <TextInput
          value={comment}
          onChangeText={onChange}
          multiline
          numberOfLines={8}
          scrollEnabled
          textAlignVertical="top"
          placeholder="Hãy mô tả trải nghiệm của bạn ở đây..."
          placeholderTextColor={colors.inactive[80]}
          className="color-foreground font-medium"
          style={{ minHeight: 155 }}
        />
      </View>
    </View>
  );
};

export default CommentSection;
