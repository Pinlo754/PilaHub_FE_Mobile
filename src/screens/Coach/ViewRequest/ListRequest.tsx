import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Alert
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { CoachService } from '../../../hooks/coach.service';
import { fetchTraineeHealthProfiles } from '../../../services/profile';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';

type RequestItem = {
    requestId: string;
    traineeFullName: string;
    traineeId: string;
    traineeAvatarUrl: string | null;
    primaryGoalName: string;
    secondaryGoalIds: string[];
    workoutLevel: string;
    trainingDays: string[];
    durationWeeks: number;
    status: string;
};

const statusColor = {
    PENDING: '#F59E0B',
    ACCEPTED: '#10B981',
    REJECTED: '#EF4444',
};

const RequestCard = ({ item, navigation }: { item: RequestItem; navigation: any }) => {

    const [loading, setLoading] = useState(false);

    const openProfile = async () => {

        try {

            setLoading(true);

            const res = await fetchTraineeHealthProfiles(item.traineeId);

            if (!res.ok) {
                Alert.alert("Lỗi", "Không tìm thấy hồ sơ sức khỏe");
                return;
            }

            const profile = res.data?.healthProfile;

            if (!profile) {
                Alert.alert("Thông báo", "Trainee chưa có BodyGram");
                return;
            }

            let metadata: any = {};

            try {
                metadata =
                    typeof profile.metadata === "string"
                        ? JSON.parse(profile.metadata)
                        : profile.metadata ?? {};
            } catch {
                metadata = {};
            }

            const measurements =
                profile.measurements ?? metadata.measurements ?? [];

            navigation.navigate("TraineeHealthProfileResult", {
                RequestItem: item,
                measurements,
                rawResponse: { entry: profile, metadata }
            });

        } catch (err) {

            console.log("Fetch error:", err);
            Alert.alert("Lỗi", "Không tải được hồ sơ");

        } finally {

            setLoading(false);

        }

    };

    return (
        <View className="bg-white mx-4 mb-4 p-5 rounded-3xl shadow-sm border-2 border-secondaryText/40">

            {/* Header */}
            <View className="flex-row items-center justify-between mb-3">

                <View className="flex-row items-center">

                    <Image
                        source={
                            item.traineeAvatarUrl
                                ? { uri: item.traineeAvatarUrl }
                                : require('../../../assets/placeholderAvatar.png')
                        }
                        className="w-12 h-12 rounded-full mr-3"
                    />

                    <View>
                        <Text className="text-lg font-bold text-gray-800">
                            {item.traineeFullName}
                        </Text>

                        <Text className="text-xs text-gray-400">
                            {item.durationWeeks} tuần tập luyện
                        </Text>
                    </View>

                </View>

                <View
                    style={{ backgroundColor: statusColor[item.status as keyof typeof statusColor] || '#999' }}
                    className="px-3 py-1 rounded-full"
                >
                    <Text className="text-white text-xs font-bold">
                        {item.status}
                    </Text>
                </View>

            </View>

            {/* Goal */}
            <View className="bg-amber-50 p-3 rounded-xl mb-3">
                <Text className="text-amber-700 font-semibold">
                    🎯 {item.primaryGoalName}
                </Text>
            </View>

            {/* Level */}
            <View className="flex-row items-center mb-3">

                <Ionicons name="barbell-outline" size={18} color="#6B7280" />

                <Text className="ml-2 text-gray-700">
                    Level: <Text className="font-semibold">{item.workoutLevel}</Text>
                </Text>

            </View>

            {/* Training Days */}
            <View className="flex-row flex-wrap mb-4">

                {item.trainingDays.map((day) => (
                    <View
                        key={day}
                        className="bg-emerald-100 px-3 py-1 rounded-full mr-2 mb-2"
                    >
                        <Text className="text-emerald-700 text-xs font-semibold">
                            {day}
                        </Text>
                    </View>
                ))}

            </View>

            {/* Button */}
            <TouchableOpacity
                className="bg-[#D28C4B] py-3 rounded-xl flex-row justify-center items-center"
                onPress={openProfile}
            >

                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <>
                        <Text className="text-white font-bold mr-2">
                            Xem chi tiết
                        </Text>

                        <Ionicons name="arrow-forward" size={18} color="white" />
                    </>
                )}

            </TouchableOpacity>

        </View>
    );
};

const ListRequest = () => {

    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<any>();

    useEffect(() => {

        const fetchRequests = async () => {

            try {

                setLoading(true);

                const response = await CoachService.getRequestRoadmap();

                setRequests(response);

            } catch (error) {

                console.error('Error fetching requests:', error);

            } finally {

                setLoading(false);

            }

        };

        fetchRequests();

    }, []);

    return (
        <View className="flex-1 bg-[#FFF7ED]">

            <Header />

            <Text className="text-2xl font-bold text-[#8B5E3C] ml-4 mt-4 mb-2">
                Danh sách yêu cầu
            </Text>

            {loading ? (

                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#A0522D" />
                </View>

            ) : (

                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.requestId}
                    renderItem={({ item }) => (
                        <RequestCard item={item} navigation={navigation} />
                    )}
                    contentContainerStyle={{ paddingBottom: 120 }}
                />

            )}

        </View>
    );
};

export default ListRequest;