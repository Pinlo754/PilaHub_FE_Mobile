import Ionicons from '@react-native-vector-icons/ionicons';
import { FlatList, Pressable, Text, View } from 'react-native';
import { CourseType } from '../../../utils/CourseType';
import CardDaily from './CardDaily';
import { useCallback } from 'react';

type Props = {
  data: CourseType[];
};

const DailyTask = ({ data }: Props) => {
  // COLOR
  const FOREGROUND = '#A0522D';

  // RENDER
  const renderItem = useCallback(({ item }: { item: CourseType }) => {
    return <CardDaily item={item} onPress={() => {}} />;
  }, []);
  return (
    <View className="pl-4">
      {/* Header */}
      <View className="flex-row gap-2 items-center">
        <Text className="color-foreground text-lg font-semibold">
          Nhiệm vụ hôm nay
        </Text>
        <Pressable>
          <Ionicons
            name="chevron-forward-outline"
            size={24}
            color={FOREGROUND}
          />
        </Pressable>
      </View>

      {/* List */}
      <View className="flex-1 mt-2">
        <FlatList
          data={data}
          keyExtractor={item => String(item)}
          renderItem={renderItem}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

export default DailyTask;
