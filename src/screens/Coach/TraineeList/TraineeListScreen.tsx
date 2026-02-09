import { View } from 'react-native';
import Trainee from './components/Trainee';
import Header from '../components/Header';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { NavigationProp, useNavigation } from '@react-navigation/native';

const TraineeListScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const viewTraineeDetails = (traineeId: string) => {
        console.log('Xem chi tiết học viên với ID:', traineeId);
        // navigation.navigate('TraineeDetailScreen', { traineeId });
    }
  return (
    <View className="flex-1 bg-background">
        <Header />
      <Trainee 
        name="Nguyễn Thanh Phong"
        birthday="07-05-2004"
        gender="Nam"
        progress={65}
        imageUri="https://randomuser.me/api/portraits/men/32.jpg"
      />
       <Trainee 
        name="Nguyễn Văn Minh Thoại"
        birthday="07-05-2004"
        gender="Nam"
        progress={95}
        imageUri="https://randomuser.me/api/portraits/men/32.jpg"
      />
       <Trainee 
        name="Nguyễn Cao Trí"
        birthday="07-05-2004"
        gender="Nam"
        progress={10}
        imageUri="https://randomuser.me/api/portraits/men/32.jpg"
      />
    </View>
  );
};
export default TraineeListScreen;       