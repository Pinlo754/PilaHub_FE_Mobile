import { Image, Text, View } from 'react-native';
import StarRating from './StarRating';
import { FeedbackType } from '../../../utils/CoachType';

type Props = {
  item: FeedbackType;
};

const CardFeedback = ({ item }: Props) => {
  return (
    <View className="bg-background-sub2 rounded-lg p-3 shadow-md elevation-md mt-3">
      <View className=" flex-row justify-between items-start gap-2">
        {/* Avatar */}
        <View className="rounded-full overflow-hidden w-10 h-10">
          <Image
            source={{
              uri: item.img_url,
            }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>

        {/* Name & Rating */}
        <View className="flex-grow self-center">
          <Text className="color-foreground font-semibold">
            {item.user_name}
          </Text>
          <StarRating rating={item.rating} size={12} />
        </View>

        {/* Date */}
        <Text className="color-secondaryText text-xs">{item.date}</Text>
      </View>

      {/* Comment */}
      <Text className="color-foreground font-medium mt-2">{item.comment}</Text>
    </View>
  );
};

export default CardFeedback;
