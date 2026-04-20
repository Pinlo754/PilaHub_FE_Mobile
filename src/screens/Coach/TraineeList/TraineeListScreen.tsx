import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'; // 1. Thêm TouchableOpacity
import Trainee from './components/Trainee';
import Header from '../components/Header';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { TraineeType } from '../../../utils/CoachBookingType';
import { TraineeService } from '../../../hooks/trainee.service';

const TraineeListScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [trainees, setTrainees] = useState<TraineeType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 2. Hàm xử lý chuyển trang
  const handleTraineePress = (traineeId: string) => {
    navigation.navigate('TraineeDetailScreen', { traineeId });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await TraineeService.getAllTrainees();
        setTrainees(data);
      } catch (error) {
        console.error('Lỗi khi tải danh sách học viên:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header />
      
      <ScrollView className="flex-1 p-2">
        {trainees.map((item) => (
          // 3. Bọc Trainee trong TouchableOpacity
          <TouchableOpacity 
            key={item.traineeId} 
            onPress={() => handleTraineePress(item.traineeId)}
            activeOpacity={0.7}
          >
            <Trainee
              name={item.fullName}
              birthday={item.age ? `${item.age} tuổi` : "Chưa cập nhật"}
              gender={item.gender}
              progress={0} 
              imageUri={item.avatarUrl || "https://via.placeholder.com/150"}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default TraineeListScreen;