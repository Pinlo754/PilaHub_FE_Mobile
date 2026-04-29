import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { TraineeType, HealthProfileType } from '../../../utils/CoachBookingType';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { TraineeService } from '../../../hooks/trainee.service';

const TraineeDetailScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'TraineeDetailScreen'>>();
    const { traineeId } = route.params as { traineeId: string };

    const [trainee, setTrainee] = useState<TraineeType | null>(null);
    const [healthProfiles, setHealthProfiles] = useState<HealthProfileType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [traineeData, healthData] = await Promise.all([
                    TraineeService.getById(traineeId),
                    TraineeService.getHealthProfile(traineeId),
                ]);
                setTrainee(traineeData);
                // Đảm bảo dữ liệu là mảng
                setHealthProfiles(Array.isArray(healthData) ? healthData : []);
            } catch (error) {
                console.error("Lỗi load chi tiết:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [traineeId]);

    // Tự động tìm profile mới nhất để hiển thị
    const latestProfile = useMemo(() => {
        if (healthProfiles.length === 0) return null;
        return [...healthProfiles].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
    }, [healthProfiles]);

    if (loading) return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></View>;

    return (
        <ScrollView className="flex-1 bg-gray-50 p-4">
            {/* Thông tin cá nhân */}
            <View className="bg-white p-5 rounded-2xl mb-4 shadow-sm border border-gray-100">
                <Image source={{ uri: trainee?.avatarUrl || 'https://via.placeholder.com/100' }} className="w-20 h-20 rounded-full mb-3" />
                <Text className="text-2xl font-bold text-gray-800">{trainee?.fullName}</Text>
                <Text className="text-gray-500 mt-1">Giới tính: {trainee?.gender === 'FEMALE' ? 'Nữ' : 'Nam'}</Text>
                <Text className="text-gray-500">Trình độ: <Text className="font-semibold text-primary">{trainee?.workoutLevel}</Text></Text>
            </View>

            {/* Thông tin sức khỏe mới nhất */}
            <Text className="text-lg font-bold mb-3 text-gray-800">Thông tin sức khỏe gần nhất</Text>
            {latestProfile ? (
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <View className="flex-row justify-between mb-4 border-b border-gray-100 pb-2">
                        <Text className="font-bold text-gray-700">Nguồn: {latestProfile.source}</Text>
                        <Text className="text-gray-400 text-xs">Cập nhật: {new Date(latestProfile.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <View className="flex-row flex-wrap">
                        <StatItem label="Chiều cao" value={`${latestProfile.heightCm || '--'} cm`} />
                        <StatItem label="Cân nặng" value={`${latestProfile.weightKg || '--'} kg`} />
                        <StatItem label="BMI" value={latestProfile.bmi ? latestProfile.bmi.toString() : '--'} />
                        <StatItem label="Mỡ cơ thể" value={`${latestProfile.bodyFatPercentage || '--'}%`} />
                        <StatItem label="Khối lượng cơ" value={`${latestProfile.muscleMassKg || '--'} kg`} />
                        <StatItem label="Vòng eo" value={`${latestProfile.waistCm || '--'} cm`} />
                    </View>
                </View>
            ) : (
                <View className="bg-white p-5 rounded-2xl items-center mb-6">
                    <Text className="text-gray-400">Chưa có dữ liệu sức khỏe nào.</Text>
                </View>
            )}
        </ScrollView>
    );
};

// Component con để hiển thị từng chỉ số
const StatItem = ({ label, value }: { label: string, value: string }) => (
    <View className="w-1/2 py-2">
        <Text className="text-gray-400 text-xs uppercase tracking-wider">{label}</Text>
        <Text className="font-bold text-gray-800 text-base">{value}</Text>
    </View>
);

export default TraineeDetailScreen;