import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { TraineeType, HealthProfileType } from '../../../utils/CoachBookingType';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { TraineeService } from '../../../hooks/trainee.service';

const TraineeDetailScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'TraineeDetailScreen'>>();
    const { traineeId } = route.params as { traineeId: string };

    const [trainee, setTrainee] = useState<TraineeType | null>(null);
    const [health, setHealth] = useState<HealthProfileType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Fetch song song để tối ưu tốc độ
                const [traineeData, healthData] = await Promise.all([
                    TraineeService.getById(traineeId),
                    TraineeService.getHealthProfile(traineeId),
                ]);
                setTrainee(traineeData);
                setHealth(healthData);
            } catch (error) {
                console.error("Lỗi load chi tiết:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [traineeId]);

    if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></View>;

    return (
        <ScrollView className="flex-1 bg-background p-4">
            {/* Thông tin cá nhân */}
            <View className="bg-white p-4 rounded-xl mb-4 shadow-sm">
                <Image source={{ uri: trainee?.avatarUrl || 'https://via.placeholder.com/100' }} className="w-20 h-20 rounded-full mb-2" />
                <Text className="text-xl font-bold">{trainee?.fullName}</Text>
                <Text className="text-gray-500">Giới tính: {trainee?.gender}</Text>
                <Text className="text-gray-500">Trình độ: {trainee?.workoutLevel}</Text>
            </View>

            {/* Thông tin sức khỏe */}
            <Text className="text-lg font-bold mb-2">Thông tin sức khỏe (InBody)</Text>
            {health ? (
                <View className="bg-white p-4 rounded-xl grid grid-cols-2 gap-4">
                    {/* Sử dụng ?? 0 để đảm bảo luôn có giá trị trước khi gọi toString() */}
                    <StatItem label="Chiều cao" value={`${(health.heightCm ?? 0).toString()} cm`} />
                    <StatItem label="Cân nặng" value={`${(health.weightKg ?? 0).toString()} kg`} />
                    <StatItem label="BMI" value={(health.bmi ?? 0).toString()} />
                    <StatItem label="Mỡ cơ thể" value={`${(health.bodyFatPercentage ?? 0).toString()}%`} />
                    <StatItem label="Khối lượng cơ" value={`${(health.muscleMassKg ?? 0).toString()} kg`} />
                    <StatItem label="Vòng eo" value={`${(health.waistCm ?? 0).toString()} cm`} />
                </View>
            ) : (
                <Text className="text-gray-400">Chưa có dữ liệu sức khỏe</Text>
            )}
        </ScrollView>
    );
};

const StatItem = ({ label, value }: { label: string, value: string }) => (
    <View className="p-2 border-b border-gray-100">
        <Text className="text-gray-400 text-xs">{label}</Text>
        <Text className="font-semibold text-base">{value}</Text>
    </View>
);

export default TraineeDetailScreen;