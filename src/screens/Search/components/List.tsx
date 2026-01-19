import { FlatList, View } from 'react-native';
import { useCallback } from 'react';
import CardExercise from './CardExercise';
import CardCourse from './CardCourse';
import CardCoach from './CardCoach';
import { SearchTab } from '../../../constants/searchTab';
import { TabDataMap } from '../../../utils/SearchType';

const CARD_MAP: {
  [K in SearchTab]: React.FC<{ item: TabDataMap[K] }>;
} = {
  [SearchTab.Exercise]: CardExercise,
  [SearchTab.Course]: CardCourse,
  [SearchTab.Coach]: CardCoach,
};

type Props<K extends SearchTab> = {
  activeTab: K;
  data: TabDataMap[K][];
};

const List = <K extends SearchTab>({ activeTab, data }: Props<K>) => {
  // RENDER
  const renderItem = useCallback(
    ({ item, index }: { item: TabDataMap[K]; index: number }) => {
      const Card = CARD_MAP[activeTab] as React.FC<{
        item: TabDataMap[K];
        isLast: boolean;
      }>;
      return <Card item={item} isLast={index === data.length - 1} />;
    },
    [activeTab, data.length],
  );

  return (
    <View className="w-full flex-1 mt-6 gap-2">
      <FlatList
        data={data}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default List;
