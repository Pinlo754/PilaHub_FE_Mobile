import { Image, Text, TouchableOpacity, View } from "react-native";
import Schedule from "../components/Schedule";
import Header from "../components/Header";
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from "../../../navigation/AppNavigator";
import LiveSessionService from "../../../hooks/liveSession.service";
import { LiveSessionType } from "../../../utils/LiveSessionType";
import React from "react";
const CommingsoonClass = () => {
    type RouteProps = RouteProp<RootStackParamList, 'CommingsoonClass'>;
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProps>();
    const startSession = (id: string) => {
        console.log(`Bắt đầu lớp học với ID: ${id}`);
        navigation.navigate('VideoCall', { bookingId: id });
    }
    const selectedId = route.params.selectedId;
    const [sessionData, setSessionData] = React.useState<LiveSessionType | null>(null);
    React.useEffect(() => {
        const fetchSessionData = async () => {
            const data = await LiveSessionService.getById(selectedId);
            setSessionData(data);
        };
        fetchSessionData();
    }, [selectedId]);

    const isRoadmap = !!sessionData?.coachBooking?.personalSchedule;
    const trainee = sessionData?.coachBooking?.trainee;


    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '';
        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };
        return new Date(dateString).toLocaleDateString('vi-VN', options);
    }
    return (
        <View className="flex-1 bg-background px-2">
            <Header />
            <Schedule />
            <View>
                <Text className="text-lg font-semibold mt-4 text-foreground">Chi tiết lịch học</Text>

                <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    {/* Header thông tin Học viên */}
                    <View className="flex-row items-center mb-6">
                        {trainee?.avatarUrl ? (
                            <Image
                                source={{ uri: trainee.avatarUrl }}
                                className="w-20 h-20 rounded-full border-2 border-primary"
                            />
                        ) : (
                            // Hiển thị một View trống hoặc Icon thay thế nếu không có ảnh
                            <View className="w-20 h-20 rounded-full border-2 border-primary bg-gray-200 justify-center items-center">
                                <Text className="text-gray-500">No Image</Text>
                            </View>
                        )}
                        <View className="ml-4 flex-1">
                            <Text className="text-xl font-bold text-foreground">{trainee?.fullName}</Text>
                            <View className="flex-row mt-1 gap-2">
                                <View className="bg-blue-100 px-2 py-1 rounded-md">
                                    <Text className="text-blue-700 text-xs font-bold">{trainee?.workoutLevel || 'N/A'}</Text>
                                </View>
                                <View className="bg-green-100 px-2 py-1 rounded-md">
                                    <Text className="text-green-700 text-xs font-bold">{trainee?.workoutFrequency || 'N/A'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Thông tin Buổi học */}
                    <View className="bg-gray-50 p-4 rounded-2xl mb-4">
                        <Text className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-2">
                            {isRoadmap ? 'Chi tiết lộ trình' : 'Buổi học lẻ'}
                        </Text>

                        {isRoadmap ? (
                            <>
                                <Text className="text-primary font-bold text-lg">{sessionData?.coachBooking?.personalSchedule?.scheduleName}</Text>
                                <Text className="text-gray-600 mt-1 text-sm">{sessionData?.coachBooking?.personalSchedule?.description}</Text>
                            </>
                        ) : (
                            <Text className="text-gray-800 font-medium">Buổi tập cá nhân (Personal Training)</Text>
                        )}

                        <View className="mt-4 pt-4 border-t border-gray-200">
                            <Text className="text-gray-700">Thời gian: {formatDate(sessionData?.coachBooking?.startTime)}</Text>
                            <Text className="text-gray-700 mt-1">Trạng thái: <Text className="font-bold text-orange-600">{sessionData?.status}</Text></Text>
                        </View>
                    </View>

                    {/* Nút thao tác */}
                    <TouchableOpacity
                        onPress={() => startSession(selectedId)}
                        className="mt-6 bg-secondaryText py-3 rounded-xl items-center"
                        activeOpacity={0.8}
                    >
                        <Text className="text-white font-bold text-base">Vào lớp ngay →</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
export default CommingsoonClass;    
