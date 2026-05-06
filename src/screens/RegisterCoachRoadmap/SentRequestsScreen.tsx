import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import RoadmapApi from '../../hooks/roadmap.api';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xử lý' },
  { key: 'ACCEPTED', label: 'Chấp nhận' },
  { key: 'REJECTED', label: 'Từ chối' },
  { key: 'CANCELLED', label: 'Huỷ' },
];

const SentRequestsScreen: React.FC = () => {
  const nav: any = useNavigation();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('ALL');
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await RoadmapApi.getMyCoachRequests();
      setItems(Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('load sent requests failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [])
  );

  const filtered = items.filter((it) => tab === 'ALL' ? true : (it.status === tab));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-warning';
      case 'ACCEPTED': return 'bg-success';
      case 'REJECTED': return 'bg-danger';
      case 'CANCELLED': return 'bg-inactive-darker';
      default: return 'bg-inactive-darker';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-warning';
      case 'ACCEPTED': return 'text-success-darker';
      case 'REJECTED': return 'text-danger-darker';
      case 'CANCELLED': return 'text-inactive-darker';
      default: return 'text-inactive-darker';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'ACCEPTED': return 'Chấp nhận';
      case 'REJECTED': return 'Từ chối';
      case 'CANCELLED': return 'Huỷ';
      default: return status;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center px-4 py-3 border-b border-background-sub1 bg-background-sub1">
        <TouchableOpacity onPress={() => nav.goBack()} className="w-10 h-10 items-center justify-center">
          <Ionicons name="arrow-back" size={24} color="#A0522D" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-lg text-foreground">Yêu cầu đã gửi</Text>
        <View className="w-10" />
      </View>

      <View className="flex-row px-2 py-2 bg-background-sub2">
        {TABS.map(tabItem => (
          <TouchableOpacity
            key={tabItem.key}
            onPress={() => setTab(tabItem.key)}
            className={`flex-1 py-2 px-2 mx-1 rounded-lg items-center justify-center ${tabItem.key === tab ? 'bg-foreground' : 'bg-background'}`}
          >
            <Text className={`font-semibold text-xs text-center ${tabItem.key === tab ? 'text-background' : 'text-foreground'}`} numberOfLines={2}>{tabItem.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator className="mt-6" color="#A0522D" />
      ) : (
        <View className="flex-1 px-4 py-2">
          <FlatList
            data={filtered}
            keyExtractor={(it) => it.requestId}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => nav.navigate('SentRequestDetail', { request: item })}
                className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-background-sub1"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-bold text-base text-foreground">{item.primaryGoalName} · {item.durationWeeks} tuần</Text>
                    <Text className="text-sm text-secondaryText mt-1">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    <Text className={`text-xs font-semibold text-white ${getStatusTextColor(item.status)}`}>{getStatusLabel(item.status)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default SentRequestsScreen;
