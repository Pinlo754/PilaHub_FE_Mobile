import { FlatList, View } from 'react-native';
import { useCallback } from 'react';
import { SEARCH_CONFIG, SearchTab } from '../../../constants/searchTab';
import { TabTypeMap } from '../../../utils/SearchType';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type Props<K extends SearchTab> = {
  activeTab: K;
  data: TabTypeMap[K][];
  navigation: NativeStackNavigationProp<RootStackParamList, 'Search'>;
};

const List = <K extends SearchTab>({
  activeTab,
  data,
  navigation,
}: Props<K>) => {
  const config = SEARCH_CONFIG[activeTab];

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

  return (
    <View className="w-full flex-1 mt-4 gap-2">
      <FlatList
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
