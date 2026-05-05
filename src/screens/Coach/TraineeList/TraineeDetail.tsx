import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { TraineeType, HealthProfileType } from '../../../utils/CoachBookingType';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { TraineeService } from '../../../hooks/trainee.service';
import { RoadmapServices } from '../../../hooks/roadmap.service';
import Ionicons from '@react-native-vector-icons/ionicons';
import Header from '../components/Header';

const TraineeDetailScreen = () => {
    const route = useRoute<RouteProp<RootStackParamList, 'TraineeDetailScreen'>>();
    const { traineeId, roadmapId } = route.params;

    const [trainee, setTrainee] = useState<TraineeType | null>(null);
    const [healthProfiles, setHealthProfiles] = useState<HealthProfileType[]>([]);
    const [roadmap, setRoadmap] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Fetch đồng thời 3 nguồn dữ liệu
                const [traineeData, healthData, roadmapData] = await Promise.all([
                    TraineeService.getById(traineeId),
                    TraineeService.getHealthProfile(traineeId),
                    RoadmapServices.getById(roadmapId)
                ]);

                setTrainee(traineeData);
                setHealthProfiles(Array.isArray(healthData) ? healthData : []);
                // Lấy phần data từ response roadmap
                setRoadmap(roadmapData?.data || roadmapData); 
            } catch (error) {
                console.error("Lỗi load chi tiết:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [traineeId, roadmapId]);

    const latestProfile = useMemo(() => {
        if (healthProfiles.length === 0) return null;
        return [...healthProfiles].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
    }, [healthProfiles]);

    // Helper format tiền tệ
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Helper format ngày
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    if (loading) return (
        <View className="flex-1 justify-center items-center bg-[#fdf2d9]">
            <ActivityIndicator size="large" color="#8b4513" />
        </View>
    );

    return (
        <ScrollView className="flex-1 bg-[#fdf2d9]">
            <Header />
            {/* 1. Header: Thông tin cá nhân */}
            <View className="bg-white p-6 rounded-b-[40px] shadow-md items-center">
                <Image 
                    source={{ uri: trainee?.avatarUrl || 'https://firebasestorage.googleapis.com/v0/b/pilahub.firebasestorage.app/o/avatars%2FProfile_avatar_placeholder_large.png?alt=media&token=6bf771ee-66fc-4ca1-930c-5f07c161292d' }} 
                    className="w-24 h-24 rounded-full mb-4 border-4 border-[#fdf2d9]" 
                />
                <Text className="text-2xl font-bold text-[#7a5c41]">{trainee?.fullName}</Text>
                <View className="flex-row mt-2">
                    <View className="bg-[#fdf2d9] px-3 py-1 rounded-full mr-2">
                        <Text className="text-[#a65d37] text-xs font-bold">{trainee?.gender === 'FEMALE' ? 'Nữ' : 'Nam'}</Text>
                    </View>
                    <View className="bg-[#7a5c41] px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-bold">{trainee?.workoutLevel || 'BEGINNER'}</Text>
                    </View>
                </View>
            </View>

            <View className="p-4">
                {/* 2. Phần Lộ trình (Roadmap) */}
                <Text className="text-lg font-bold mb-3 text-[#7a5c41] ml-2">Lộ trình hiện tại</Text>
                <View className="bg-white p-5 rounded-[25px] mb-6 shadow-sm border border-[#eaddc2]">
                    <Text className="text-xl font-bold text-[#8b4513] mb-2">{roadmap?.title}</Text>
                    
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="calendar-outline" size={16} color="#a65d37" />
                        <Text className="text-gray-500 text-sm ml-1">
                            {formatDate(roadmap?.startDate)} - {formatDate(roadmap?.endDate)}
                        </Text>
                    </View>

                    <Text className="text-gray-600 leading-5 mb-4 italic">
                        "{roadmap?.description}"
                    </Text>

                    {/* Progress Bar */}
                    <View className="mb-4">
                        <View className="flex-row justify-between mb-1">
                            <Text className="font-bold text-[#7a5c41]">Tiến độ</Text>
                            <Text className="font-bold text-[#7a5c41]">{roadmap?.progressPercent}%</Text>
                        </View>
                        <View className="h-3 w-full bg-[#eaddc2] rounded-full overflow-hidden">
                            <View 
                                className="h-full bg-[#8b4513]" 
                                style={{ width: `${roadmap?.progressPercent}%` }} 
                            />
                        </View>
                    </View>

                    {/* Goals Tags */}
                    <View className="flex-row flex-wrap mb-2">
                        {roadmap?.goals?.map((goal: any) => (
                            <View key={goal.roadmapGoalId} className="bg-[#fdf2d9] border border-[#a65d37] px-3 py-1 rounded-lg mr-2 mb-2">
                                <Text className="text-[#a65d37] text-xs font-medium"># {goal.vietnameseName}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 3. Chỉ số sức khỏe */}
                <Text className="text-lg font-bold mb-3 text-[#7a5c41] ml-2">Chỉ số sức khỏe</Text>
                {latestProfile ? (
                    <View className="bg-white p-5 rounded-[25px] shadow-sm border border-[#eaddc2] mb-10">
                        <View className="flex-row justify-between mb-4 border-b border-[#fdf2d9] pb-2">
                            <Text className="font-bold text-[#7a5c41]">Nguồn: {latestProfile.source}</Text>
                            <Text className="text-gray-400 text-xs">Cập nhật: {formatDate(latestProfile.createdAt)}</Text>
                        </View>
                        <View className="flex-row flex-wrap">
                            <StatItem label="Chiều cao" value={`${latestProfile.heightCm || '--'} cm`} icon="man-outline" />
                            <StatItem label="Cân nặng" value={`${latestProfile.weightKg || '--'} kg`} icon="speedometer-outline" />
                            <StatItem label="BMI" value={latestProfile.bmi ? latestProfile.bmi.toString() : '--'} icon="calculator-outline" />
                            <StatItem label="Mỡ cơ thể" value={`${latestProfile.bodyFatPercentage || '--'}%`} icon="fitness-outline" />
                            <StatItem label="Khối lượng cơ" value={`${latestProfile.muscleMassKg || '--'} kg`} icon="barbell-outline" />
                            <StatItem label="Vòng eo" value={`${latestProfile.waistCm || '--'} cm`} icon="body-outline" />
                        </View>
                    </View>
                ) : (
                    <View className="bg-white p-8 rounded-[25px] items-center mb-10 border border-dashed border-[#a65d37]">
                        <Ionicons name="analytics-outline" size={40} color="#eaddc2" />
                        <Text className="text-gray-400 mt-2">Chưa có dữ liệu sức khỏe.</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

// Component con hiển thị chỉ số
const StatItem = ({ label, value, icon }: { label: string, value: string, icon: string }) => (
    <View className="w-1/2 py-3 flex-row items-center">
        <View className="bg-[#fdf2d9] p-2 rounded-lg mr-2">
            <Ionicons name={icon as any} size={18} color="#a65d37" />
        </View>
        <View>
            <Text className="text-gray-400 text-[10px] uppercase tracking-tighter">{label}</Text>
            <Text className="font-bold text-[#7a5c41] text-base">{value}</Text>
        </View>
    </View>
);

export default TraineeDetailScreen;