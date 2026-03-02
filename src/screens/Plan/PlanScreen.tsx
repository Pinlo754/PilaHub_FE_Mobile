import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const PlanScreen: React.FC = () => {
  const navigation: any = useNavigation();
  const [dates, setDates] = useState<Date[]>([]);
  const [now, setNow] = useState<Date>(new Date());

  const getNextNDates = (n: number) => {
    const arr: Date[] = [];
    const today = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  };

  const isSameDay = (a: Date, b: Date) => {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  const formatMonthYear = (d: Date) => {
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const chunk = <T,>(arr: T[], size: number) => {
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
    return res;
  };

  useEffect(() => {
    setDates(getNextNDates(30));
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-lg">←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-semibold text-foreground">Lộ Trình Của Bạn</Text>
        <TouchableOpacity>
          <Text className="text-lg">⋯</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <ScrollView className="px-4" contentContainerStyle={styles.contentPadding}>
          {/* Stage chips */}
          <View className="flex-row justify-between mt-3">
            <View className="flex-row gap-x-2">
              <TouchableOpacity className="bg-foreground px-3 py-2 rounded-lg ">
                <Text className="text-white">Giai đoạn 1</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-white px-3 py-2 rounded-lg border border-gray-200">
                <Text>Giai đoạn 2</Text>
              </TouchableOpacity>
              <TouchableOpacity className="bg-white px-3 py-2 rounded-lg border border-gray-200">
                <Text>Giai đoạn 3</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <Text className="mt-4 text-sm text-foreground">
            Xây dựng nền tảng vững chắc với các bài tập cơ bản, học kỹ thuật đúng và tạo thói quen tập luyện.
          </Text>

          {/* Checklist */}
          <View className="mt-3 bg-white rounded-lg p-4 border border-gray-200">
            <Text className="text-base font-semibold">✓ Đánh giá thể trạng ban đầu</Text>
            <Text className="text-base font-semibold mt-2">✓ Học kỹ thuật động tác cơ bản</Text>
            <Text className="text-base mt-2">○ Xây dựng thói quen tập luyện</Text>
          </View>

          {/* Calendar showing next 30 days */}
          <View className="mt-4 bg-white rounded-lg p-3 border border-gray-200">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold">{dates[0] ? formatMonthYear(dates[0]) : formatMonthYear(new Date())}</Text>
              <Text className="text-sm text-gray-500">{formatTime(now)}</Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-xs">MON</Text>
              <Text className="text-xs">TUE</Text>
              <Text className="text-xs">WED</Text>
              <Text className="text-xs">THU</Text>
              <Text className="text-xs">FRI</Text>
              <Text className="text-xs">SAT</Text>
              <Text className="text-xs">SUN</Text>
            </View>

            {chunk(dates, 7).map((week, wi) => (
              <View key={wi} className="flex-row justify-between mb-2">
                {week.map((d, idx) => {
                  const today = isSameDay(d, now);
                  return (
                    <View key={idx} className="items-center" style={styles.dateCell}>
                      <View style={[styles.dateCircle, today && styles.dateCircleToday]}>
                        <Text style={[styles.dateText, today && styles.dateTextToday]}>{d.getDate()}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Supplement section */}
          <Text className="mt-4 text-base font-semibold">Thực Phẩm Chức Năng Hỗ Trợ</Text>
          <View className="mt-2 bg-white rounded-lg p-3 border border-gray-200 flex-row items-center">
            <Image source={{ uri: 'https://via.placeholder.com/80' }} className="w-20 h-20 rounded-lg" />
            <View className="flex-1 ml-3 min-w-0">
              <Text className="font-semibold">Omega-3</Text>
              <Text className="text-sm text-gray-500">Giảm viêm, hỗ trợ sức khỏe tim mạch và tăng cường trao đổi chất</Text>
            </View>
            <View className="px-2 py-1 bg-blue-100 rounded-full">
              <Text className="text-xs text-blue-600">buổi 1</Text>
            </View>
          </View>

          {/* Tools section */}
          <Text className="mt-4 text-base font-semibold">Dụng Cụ Cần Thiết</Text>
          <View className="mt-2 bg-white rounded-lg p-3 border border-gray-200 flex-row items-center justify-between">
            <View className="flex-row items-center min-w-0 flex-1">
              <Image source={{ uri: 'https://via.placeholder.com/60' }} className="w-16 h-16 rounded-lg" />
              <View className="ml-3">
                <Text className="font-semibold">Thảm Tập Pilates</Text>
                <Text className="text-sm text-gray-500 ">Thảm dày 8mm, chống trượt, hỗ trợ tối ưu cho các bài Pilates</Text>
              </View>
            </View>
            <View className="px-2 py-1 bg-purple-100 rounded-full">
              <Text className="text-xs text-purple-600">Ngay</Text>
            </View>
          </View>

          <View className="h-2" />
        </ScrollView>
      </View>

      {/* Fixed footer area */}
      <View className="px-6 bg-transparent">
        <TouchableOpacity className="h-12  bg-foreground rounded-lg items-center justify-center" onPress={() => navigation.navigate('UpgradePlan')}>
          <Text className="text-white text-lg font-semibold">Tiếp tục</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  contentPadding: { paddingBottom: 140 },
  dateCell: { width: `${100 / 7}%` },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleToday: {
    backgroundColor: '#A0522D',
  },
  dateText: {
    color: '#000',
  },
  dateTextToday: {
    color: '#fff',
  },
});

export default PlanScreen;
