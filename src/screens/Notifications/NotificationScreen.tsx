import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, ActivityIndicator, Alert, Pressable } from 'react-native';
import { MessageService, NotificationItem } from '../../hooks/notification.service';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../theme/colors';
import Header from '../Coach/components/Header';
const NotificationScreen = ({ route, navigation }: any)  => {
    const navigate = navigation.navigate;
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchNotifications = async () => {
        try {
            const data = await MessageService.getAll();
            setNotifications(data.content);
        } catch (error) {
            Alert.alert("Lỗi", "Không thể tải thông báo");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleReadAll = async () => {
        try {
            await MessageService.readAll();
            // Cập nhật local state: đánh dấu tất cả là đã đọc
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            Alert.alert("Lỗi", "Không thể đánh dấu tất cả");
        }
    };

    const handleOpenDetail = async (item: NotificationItem) => {
        setSelectedNotification(item);
        setModalVisible(true);
        
        // Nếu chưa đọc thì gọi API đọc
        if (!item.read) {
            try {
                await MessageService.read(item.notificationId);
                // Cập nhật local state
                setNotifications(prev => prev.map(n => 
                    n.notificationId === item.notificationId ? { ...n, read: true } : n
                ));
            } catch (error) {
                console.error("Lỗi cập nhật trạng thái đọc");
            }
        }
    };

    if (loading) return <View className="flex-1 justify-center"><ActivityIndicator /></View>;

    return (
        <SafeAreaView className="flex-1 bg-white p-4">
            <Header/>
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold">Thông báo</Text>
                <TouchableOpacity onPress={handleReadAll}>
                    <Text className="text-blue-500">Đọc tất cả</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.notificationId}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        className={`p-4 mb-2 rounded-2xl border ${item.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200 shadow-sm'}`}
                        onPress={() => handleOpenDetail(item)}
                    >
                        <View className="flex-row justify-between items-start gap-2">
                            <Text className={`flex-1 text-base ${item.read ? 'text-gray-700' : 'text-blue-900'} font-semibold`}>{item.title}</Text>
                            <View className={`px-2 py-0.5 rounded-full text-xs ${item.read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                                <Text className={`text-[11px] ${item.read ? 'text-gray-500' : 'text-blue-800'} font-medium`}>{item.read ? 'Đã đọc' : 'Mới'}</Text>
                            </View>
                        </View>
                        <Text numberOfLines={1} className={`${item.read ? 'text-gray-500' : 'text-blue-700'} mt-2`}>{item.message}</Text>
                    </TouchableOpacity>
                )}
            />

            {/* Modal chi tiết */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View className="flex-1 justify-center bg-black/50 p-6">
                    <View className="bg-white p-6 rounded-2xl">
                        <Text className="text-xl font-bold mb-2">{selectedNotification?.title}</Text>
                        <Text className="text-gray-700 mb-6">{selectedNotification?.message}</Text>
                        <TouchableOpacity 
                            className="bg-blue-500 p-3 rounded-lg"
                            onPress={() => setModalVisible(false)}
                        >
                            <Text className="text-white text-center font-bold">Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default NotificationScreen;