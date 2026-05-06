import { Image, Text, TouchableOpacity, View, Alert } from "react-native";
import Schedule from "../components/Schedule";
import Header from "../components/Header";
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from "../../../navigation/AppNavigator";
import LiveSessionService from "../../../hooks/liveSession.service";
import { LiveSessionType } from "../../../utils/LiveSessionType";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import ModalPopup, { IconColor } from "../../../components/ModalPopup"; // Giả sử bạn dùng component ModalPopup đã tạo ở các turn trước

type ModalState = {
    visible: boolean;
    mode: 'noti' | 'toast' | 'confirm';
    title?: string;
    message: string;
    iconName?: string;
    iconBgColor?: IconColor; // Dùng Type IconColor export từ ModalPopup
};

const CommingsoonClass = () => {
    type RouteProps = RouteProp<RootStackParamList, 'CommingsoonClass'>;
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProps>();
    const selectedId = route.params.selectedId;

    const [sessionData, setSessionData] = useState<LiveSessionType | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const [modalState, setModalState] = useState<ModalState>({
        visible: false,
        mode: 'noti',
        message: '',
    });

    const closeModal = useCallback(() => { // Nên dùng useCallback nếu truyền vào memo component
        setModalState((s) => ({
            ...s,
            visible: false,
        }));
    }, []);

    const fetchSessionData = async () => {
        const data = await LiveSessionService.getById(selectedId);
        setSessionData(data);
    };

    useEffect(() => {
        fetchSessionData();
    }, [selectedId]);

    // 1. Validate điều kiện hủy (Trước 24h)
    const canCancel = useMemo(() => {
        if (!sessionData?.coachBooking?.startTime) return false;

        const startTime = new Date(sessionData.coachBooking.startTime).getTime();
        const now = new Date().getTime();
        const diffInHours = (startTime - now) / (1000 * 60 * 60);

        // Trạng thái phải là chưa học và thời gian còn lại > 24 tiếng
        return diffInHours > 24 && (sessionData.status as string) !== 'CANCELLED';
    }, [sessionData]);

    const handleCancelPress = () => {
        if (!canCancel) return;
        setShowConfirmModal(true);
    };

    const confirmCancel = async () => {
        setShowConfirmModal(false);
        setIsCancelling(true);
        try {
            // await LiveSessionService.cancel(selectedId);
            console.log("Đã gọi API hủy lịch với ID:", selectedId);
            setModalState({
                visible: true,
                mode: 'noti',
                title: 'Thành công',
                message: 'Hủy lịch thành công!', // Dùng contentText
                iconName: 'checkmark-circle',
                iconBgColor: 'green',
            });
            fetchSessionData(); // Tải lại dữ liệu để cập nhật status
        } catch (error) {
            setModalState({
                visible: true,
                mode: 'noti',
                title: 'Lỗi',
                message: `Hủy lịch thất bại!`,
                iconName: 'alert-circle',
                iconBgColor: 'red',
            });
        } finally {
            setIsCancelling(false);
        }
    };

    const isRoadmap = !!sessionData?.coachBooking?.personalSchedule;
    const trainee = sessionData?.coachBooking?.trainee;

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '';
        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
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
                            <Image source={{ uri: trainee.avatarUrl }} className="w-20 h-20 rounded-full border-2 border-primary" />
                        ) : (
                            <View className="w-20 h-20 rounded-full border-2 border-primary bg-gray-200 justify-center items-center">
                                <Text className="text-gray-500 text-[10px]">No Image</Text>
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
                    <View className="flex-row gap-3">
                        {/* Nút Hủy Lịch */}
                        <TouchableOpacity
                            onPress={handleCancelPress}
                            disabled={!canCancel || isCancelling}
                            className={`flex-1 py-3 rounded-xl items-center border ${canCancel ? 'border-red-500 bg-white' : 'border-gray-200 bg-gray-50'}`}
                            activeOpacity={0.7}
                        >
                            <Text className={`font-bold text-base ${canCancel ? 'text-red-500' : 'text-gray-400'}`}>Hủy lịch</Text>
                        </TouchableOpacity>

                        {/* Nút Vào Lớp */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('VideoCall', { bookingId: selectedId })}
                            className="flex-[1.5] bg-secondaryText py-3 rounded-xl items-center"
                            activeOpacity={0.8}
                        >
                            <Text className="text-white font-bold text-base">Vào lớp ngay →</Text>
                        </TouchableOpacity>
                    </View>

                    {!canCancel && (sessionData?.status as string) !== 'CANCELLED' && (
                        <Text className="text-red-400 text-[10px] text-center mt-2 font-medium">
                            * Chỉ có thể hủy lịch trước thời gian bắt đầu 24 tiếng
                        </Text>
                    )}
                </View>
            </View>

            {/* Modal Confirm Hủy */}
            <ModalPopup
                visible={showConfirmModal}
                mode="confirm"
                titleText="Xác nhận hủy"
                contentText="Bạn có chắc chắn muốn hủy lịch học này không? Hành động này không thể hoàn tác."
                iconName="alert-circle"
                iconBgColor="yellow"
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmCancel}
                confirmBtnText="Đồng ý hủy"
                cancelBtnText="Quay lại"
                confirmBtnColor="red"
            />
            <ModalPopup
                {...(modalState as any)}
                titleText={modalState.title}
                contentText={modalState.message}
                iconName={modalState.iconName}
                iconBgColor={modalState.iconBgColor}
                onClose={closeModal}
            />
        </View>
    );
};

export default CommingsoonClass;