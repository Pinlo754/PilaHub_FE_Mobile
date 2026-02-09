import { Text, View } from 'react-native';
import Header from '../components/Header';
import Schedule from '../components/Schedule';
import RegisterSchedule from './ScheduleComponents/RegisterSchedule';

const CoachRegisterSchedule = () => {
  return (
    <View className="flex-1 bg-background">
      <Header />
      <RegisterSchedule />
    </View>
  );
};

export default CoachRegisterSchedule;
