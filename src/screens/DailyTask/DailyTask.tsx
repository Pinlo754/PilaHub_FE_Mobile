import { View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Header from './components/Header';
import Calendar from './components/Calendar';
import List from './components/List';
import { dailyTaskMock } from '../../mocks/dailyTaskData';

type Props = NativeStackScreenProps<RootStackParamList, 'DailyTask'>;

const DailyTask = (props: Props) => {
  return (
    <View className="flex-1 pt-14 bg-background">
      {/* Header */}
      <Header navigation={props.navigation} />

      {/* Calendar */}
      <Calendar />

      {/* List Section */}
      <List data={dailyTaskMock} navigation={props.navigation} />
    </View>
  );
};

export default DailyTask;
