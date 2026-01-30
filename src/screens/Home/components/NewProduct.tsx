import Ionicons from '@react-native-vector-icons/ionicons';
import { FlatList, Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { useCallback } from 'react';
import CardProduct from './CardProduct';
import { ProductType } from '../../../utils/ProductType';

type Props = {
  data: ProductType[];
};

const NewProduct = ({ data }: Props) => {
  // RENDER
  const renderItem = useCallback(({ item }: { item: ProductType }) => {
    return <CardProduct item={item} onPress={() => {}} />;
  }, []);
  return (
    <View className="pl-4 mt-4">
      {/* Header */}
      <View className="flex-row gap-2 items-center mb-2">
        <Text className="color-foreground text-lg font-semibold">
          Sản phẩm mới
        </Text>
        <Pressable>
          <Ionicons
            name="chevron-forward-outline"
            size={20}
            color={colors.foreground}
          />
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={item => String(item.product_id)}
        renderItem={renderItem}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default NewProduct;
