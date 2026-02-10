import { Image, Text, View } from 'react-native';
import { ErrorItemType } from '../../../utils/SummaryType';

type Props = {
  item: ErrorItemType;
};

const ErrorExpandContent = ({ item }: Props) => {
  return (
    <View className="mt-3 px-2">
      <View
        className="rounded-lg overflow-hidden mb-4 self-center"
        style={{ width: 300, height: 160 }}
      >
        <Image
          source={{ uri: item.thumbnail_url }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      <Text className="text-foreground font-medium">{item.desc}</Text>
    </View>
  );
};

export default ErrorExpandContent;
