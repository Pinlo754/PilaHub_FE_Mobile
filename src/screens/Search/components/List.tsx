import { FlatList, Text, View } from 'react-native';
import { useCallback, useRef } from 'react';
import { SEARCH_CONFIG, SearchTab } from '../../../constants/searchTab';
import { TabTypeMap } from '../../../utils/SearchType';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';

type Props<K extends SearchTab> = {
  activeTab: K;
  data: TabTypeMap[K][];
  navigation: NativeStackNavigationProp<RootStackParamList, 'Search'>;
  isSearching: boolean;
};

const EmptyState = () => (
  <View className="flex-1 items-center justify-center gap-3 mb-20">
    <Ionicons name="search-outline" size={56} color={colors.inactive[80]} />
    <Text className="text-foreground font-semibold text-lg">
      Không tìm thấy kết quả
    </Text>
    <Text className="text-secondaryText text-center px-8">
      Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc
    </Text>
  </View>
);

const List = <K extends SearchTab>({
  activeTab,
  data,
  navigation,
  isSearching,
}: Props<K>) => {
  const config = SEARCH_CONFIG[activeTab];

  // USE REF
  const listRef = useRef<FlatList<TabTypeMap[K]>>(null);

  // USE FOCUS EFFECT
  useFocusEffect(
    useCallback(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, []),
  );

  // RENDER
  const renderItem = useCallback(
    ({ item, index }: { item: TabTypeMap[K]; index: number }) => {
      const Card = config.Card;
      const id = (item as any)[config.idKey];

      return (
        <Card
          item={item}
          isLast={index === data.length - 1}
          onPress={() => {
            console.log('ID: ', id);
            navigation.navigate(
              config.screen as any,
              {
                [config.paramKey]: id,
              } as any,
            );
          }}
        />
      );
    },
    [config, data.length, navigation],
  );

  if (isSearching && data.length === 0) {
    return <EmptyState />;
  }

  return (
    <View className="w-full flex-1 mt-4 gap-2">
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={item => String(item[config.idKey as keyof typeof item])}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
};

export default List;
