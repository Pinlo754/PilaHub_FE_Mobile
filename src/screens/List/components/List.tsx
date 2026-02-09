import { FlatList, View } from 'react-native';
import { useCallback, useRef } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { LIST_CONFIG, ListTab } from '../../../constants/listTab';
import { TabTypeMap } from '../../../utils/ListType';
import { useFocusEffect } from '@react-navigation/native';

type Props<K extends ListTab> = {
  activeTab: K;
  data: TabTypeMap[K][];
  navigation: NativeStackNavigationProp<RootStackParamList, 'List'>;
};

const List = <K extends ListTab>({ activeTab, data, navigation }: Props<K>) => {
  const config = LIST_CONFIG[activeTab];

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
    ({ item }: { item: TabTypeMap[K] }) => {
      const Card = config.Card;
      const id = (item as any)[config.idKey];

      return (
        <Card
          item={item}
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
    [config, navigation],
  );

  return (
    <View className="w-full flex-1 mt-4 gap-2">
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={item => String(item[config.idKey as keyof typeof item])}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
      />
    </View>
  );
};

export default List;
