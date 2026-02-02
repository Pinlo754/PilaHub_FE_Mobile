import { Image, Pressable, Text, View } from 'react-native';
import { ProductType } from '../../../utils/ProductType';
import { formatVND } from '../../../utils/number';

type Props = {
  item: ProductType;
  onPress: () => void;
};

const CardProduct = ({ item, onPress }: Props) => {
  return (
    <Pressable
      className="mr-4 w-[160px] border border-foreground rounded-lg overflow-hidden"
      onPress={onPress}
    >
      <View className="h-[180px]">
        <Image
          source={{
            uri: item.thumnail_url,
          }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
      <View className="p-2">
        <Text className="color-foreground font-medium">
          {item.product_name}
        </Text>
        <Text className="color-secondaryText text-lg font-bold">
          {formatVND(item.price)}
        </Text>
      </View>
    </Pressable>
  );
};

export default CardProduct;
