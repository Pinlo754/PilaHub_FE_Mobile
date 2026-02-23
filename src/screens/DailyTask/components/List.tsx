import { FlatList, View } from 'react-native';
import CardCourse from './CardCourse';
import CardCall from './CardCall';
import { CardItem } from '../../../utils/DailyTaskType';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type Props = {
  data: CardItem[];
  navigation: NativeStackNavigationProp<RootStackParamList, 'DailyTask'>;
};

const List = ({ data, navigation }: Props) => {
  // HANDLERS
  const onPressItem = (item: CardItem) => {
    if (item.type === 'call') {
      navigation.navigate('ProgramDetail', { program_id: item.id });
      return;
    }

    navigation.navigate('ProgramDetail', { program_id: item.id });
  };

  // RENDER
  const renderItem = ({ item }: { item: CardItem }) => {
    if (item.type === 'call') {
      return <CardCall item={item} onPress={() => onPressItem(item)} />;
    }

    return <CardCourse item={item} onPress={() => onPressItem(item)} />;
  };

  return (
    <View className="flex-1 w-full px-4 pt-4">
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default List;
