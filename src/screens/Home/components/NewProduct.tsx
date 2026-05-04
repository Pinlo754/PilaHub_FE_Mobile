import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';

import { colors } from '../../../theme/colors';

import NewProductCard from './NewProductCard';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { getNewProducts, ProductItem } from '../../../services/products';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NewProduct = () => {
  const navigation = useNavigation<NavigationProp>();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const data = await getNewProducts();

      console.log('NEW PRODUCTS:', JSON.stringify(data?.[0], null, 2));

      setProducts(data ?? []);
    } catch (error: any) {
      console.log('Fetch new products error:', error);

      setErrorMessage(
        error?.message || 'Không thể tải danh sách sản phẩm.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleGoToDetail = useCallback(
    (productId: string) => {
      navigation.navigate('ProductDetail', {
        productId,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProductItem }) => {
      return (
        <NewProductCard
          item={item}
          onPress={() => handleGoToDetail(item.productId)}
          onAddPress={() => {}}
        />
      );
    },
    [handleGoToDetail],
  );

  return (
    <View className="pl-4 mt-4">
      {/* Header */}
      <View className="flex-row gap-2 items-center mb-2 pr-4">
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

      {/* Content */}
      {loading ? (
        <View className="h-32 items-center justify-center">
          <ActivityIndicator size="small" color={colors.background.DEFAULT} />

          <Text className="mt-2 text-sm color-secondaryText">
            Đang tải sản phẩm...
          </Text>
        </View>
      ) : errorMessage ? (
        <View className="h-32 mr-4 rounded-2xl bg-red-50 items-center justify-center px-4">
          <Text className="text-sm text-red-500 text-center">
            {errorMessage}
          </Text>

          <Pressable
            onPress={fetchProducts}
            className="mt-3 px-4 py-2 rounded-full bg-red-100"
          >
            <Text className="text-red-500 font-medium">Thử lại</Text>
          </Pressable>
        </View>
      ) : products.length === 0 ? (
        <View className="h-32 mr-4 rounded-2xl bg-gray-100 items-center justify-center px-4">
          <Text className="text-sm color-secondaryText text-center">
            Chưa có sản phẩm mới.
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => String(item.productId)}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View className="w-4" />}
          contentContainerStyle={{
            paddingRight: 20,
            paddingVertical: 6,
          }}
        />
      )}
    </View>
  );
};

export default NewProduct;