import Ionicons from '@react-native-vector-icons/ionicons';
import { FlatList, Pressable, Text, View } from 'react-native';
import { CourseType } from '../../../utils/CourseType';
import CardDaily from './CardDaily';
import { useCallback } from 'react';
import { colors } from '../../../theme/colors';

type Props = {
  data: CourseType[];
};

const DailyTask = ({ data }: Props) => {
  // RENDER
  const renderItem = useCallback(({ item }: { item: CourseType }) => {
    return <CardDaily item={item} onPress={() => {}} />;
  }, []);
  return (
    <View className="pl-4">
      {/* Header */}
      <Pressable className="flex-row gap-2 items-center mb-2">
        <Text className="color-foreground text-lg font-semibold">
          Nhiệm vụ hôm nay
        </Text>

        <Ionicons
          name="chevron-forward-outline"
          size={20}
          color={colors.foreground}
        />
      </Pressable>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={item => String(item.course_id)}
        renderItem={renderItem}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default DailyTask;
