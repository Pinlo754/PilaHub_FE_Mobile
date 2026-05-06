import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import Trainee from './components/Trainee';
import Header from '../components/Header';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { TraineeType } from '../../../utils/CoachBookingType';
import { TraineeService } from '../../../hooks/trainee.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoadmapServices } from '../../../hooks/roadmap.service';

// 1. Thêm roadmapId vào type
type TraineeWithProgress = TraineeType & { 
  progressPercent: number;
  roadmapId: string; 
};

const TraineeListScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [trainees, setTrainees] = useState<TraineeWithProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 2. Cập nhật hàm nhận thêm tham số roadmapId
  const handleTraineePress = (traineeId: string, roadmapId: string) => {
    navigation.navigate('TraineeDetailScreen', { traineeId, roadmapId });
  };

  const formatGender = (gender?: string) => {
    if (!gender) return "Chưa cập nhật";
    const lowerGender = gender.toLowerCase();
    if (lowerGender === 'male' || lowerGender === 'm' || lowerGender === 'nam') return 'Nam';
    if (lowerGender === 'female' || lowerGender === 'f' || lowerGender === 'nữ') return 'Nữ';
    return 'Khác';
  };

  const formatWorkoutLevel = (level?: string) => {
    switch (level) {
      case 'ADVANCED': return 'Nâng cao';
      case 'INTERMEDIATE': return 'Trung bình';
      case 'BEGINNER': return 'Người mới';
      default: return 'Chưa cập nhật';
    }
  };

  const formatWorkoutFrequency = (frequency?: string) => {
    switch (frequency) {
      case 'ATHLETE': return 'Vận động viên';
      case 'ACTIVE': return 'Năng động';
      case 'MODERATE': return 'Vận động vừa';
      case 'LIGHT': return 'Vận động nhẹ';
      case 'SEDENTARY': return 'Ít vận động';
      default: return 'Chưa cập nhật';
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const idStr = await AsyncStorage.getItem('id');
        const currentId = idStr ? JSON.parse(idStr) : null;

        const roadmapResponse = await RoadmapServices.getMyRoadmap();
        const roadmaps = roadmapResponse?.content || [];

        const uniqueTraineeIds = [
          ...new Set(roadmaps.map((roadmap: any) => roadmap.traineeId).filter(Boolean))
        ] as string[];

        const traineePromises = uniqueTraineeIds.map((id) => TraineeService.getById(id));
        const traineesData = await Promise.all(traineePromises);
        
        const traineesWithProgress: TraineeWithProgress[] = traineesData.map(trainee => {
          const matchedRoadmap = roadmaps.find((r: any) => r.traineeId === trainee.traineeId);
          return {
            ...trainee,
            progressPercent: matchedRoadmap?.progressPercent || 0,
            roadmapId: matchedRoadmap?.roadmapId || '' // 3. Lấy roadmapId ghép vào data
          };
        });

        setTrainees(traineesWithProgress);

      } catch (error) {
        console.error('Lỗi khi tải danh sách học viên từ roadmap:', error);
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
          <TouchableOpacity 
            key={item.traineeId} 
            // 4. Truyền cả 2 ID vào hàm xử lý
            onPress={() => handleTraineePress(item.traineeId, item.roadmapId)}
            activeOpacity={0.7}
          >
            <Trainee
              name={item.fullName}
              birthday={item.age ? `${item.age} tuổi` : "Chưa cập nhật"}
              gender={formatGender(item.gender)}
              workoutLevel={formatWorkoutLevel(item.workoutLevel)}
              workoutFrequency={formatWorkoutFrequency(item.workoutFrequency)}
              progress={item.progressPercent} 
              imageUri={item.avatarUrl || 'https://firebasestorage.googleapis.com/v0/b/pilahub.firebasestorage.app/o/avatars%2FProfile_avatar_placeholder_large.png?alt=media&token=6bf771ee-66fc-4ca1-930c-5f07c161292d'}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default TraineeListScreen;