import React, { useState, useMemo, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import CalendarStrip from 'react-native-calendar-strip';
import moment from 'moment';
import 'moment/locale/vi'; // Import tiếng Việt
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';

// Thiết lập locale cho moment
moment.locale('vi');

type ScheduleItem = {
  id: string;
  date: string;
  time: string;
  student: string;
  lesson: string;
  content: string;
};

const MyCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<moment.Moment>(moment());
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const route = useRoute();

  const handlePressSchedule = (id: string) => {
    // nếu chưa ở trang CommingsoonClass thì navigate
    if (route.name !== 'CommingsoonClass') {
      navigation.navigate('CommingsoonClass', {
      selectedId:id,
    });
    } else {
      // nếu đã ở rồi thì chỉ update param
      navigation.setParams({
        selectedId: id,
      });
    }
  };


  const scheduleData: ScheduleItem[] = [
    {
      id: '1',
      date: '2026-02-07',
      time: '08:00 10:00',
      student: 'Nguyễn Thanh Phong',
      lesson: '9',
      content: 'Duỗi chân đơn, duỗi chân đôi',
    },
    {
      id: '2',
      date: '2026-02-07',
      time: '16:00 18:00',
      student: 'Nguyễn Văn Minh Thoại',
      lesson: '2',
      content: 'Điều khiển hơi thở',
    },
    {
      id: '3',
      date: '2026-02-08',
      time: '09:00 11:00',
      student: 'Lê Hoàng Nam',
      lesson: '11',
      content: 'Tập cơ bụng nâng cao',
    },
  ];

  const filteredData = useMemo(() => {
    return scheduleData.filter(item =>
      moment(item.date).isSame(moment(selectedDate), 'day'),
    );
  }, [selectedDate]);


  const markedDates = useMemo(() => {
    return scheduleData.map(item => ({
      date: moment(item.date),
      dots: [{ color: '#D28C4A', selectedColor: 'white' }],
    }));
  }, []);

  useEffect(() => {
    setSelectedDate(moment());
  }, []);

  const renderItem = ({ item }: { item: ScheduleItem }) => {
    const times = item.time.split(' ');
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handlePressSchedule(item.id)}
      >
        <View className="flex-row bg-[#FFF5E6] mx-4 my-2 rounded-2xl overflow-hidden">
          <View className="w-[85px] bg-[#D28C4A] justify-center items-center">
            <Text className="text-white font-bold text-lg leading-6">{times[0]}</Text>
            <Text className="text-white font-bold text-lg leading-6">{times[1]}</Text>
          </View>


          <View className="flex-1 px-4 py-2 justify-center">
            <Text className="text-[#8B5E3C] text-base mb-1" numberOfLines={1}>
              <Text className="font-bold">Học viên: </Text>{item.student}
            </Text>
            <Text className="text-[#8B5E3C] text-base mb-1">
              <Text className="font-bold">Buổi: </Text>{item.lesson}
            </Text>
            <Text className="text-[#8B5E3C] text-base leading-5" numberOfLines={2}>
              <Text className="font-bold">Nội dung: </Text>{item.content}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="bg-[#F5DEB3] rounded-3xl pb-4 max-h-96">
      <View className="pt-2 px-5 flex-row items-center">
        <Text className="text-2xl font-bold text-[#8B5E3C]">Lịch học</Text>
        <Text className="ml-2 text-xl text-[#8B5E3C]">🕒</Text>
      </View>

      <CalendarStrip
        scrollable
        calendarAnimation={{ type: 'sequence', duration: 30 }}
        daySelectionAnimation={{ type: 'background', duration: 200, highlightColor: '#8B4513' }}
        style={{ height: 80, paddingTop: 2, paddingBottom: 2 }}
        calendarColor={'#F5DEB3'}
        scrollToOnSetSelectedDate={true}
        useIsoWeekday={false}

        dateNumberStyle={{ color: '#8B5E3C', fontSize: 12, fontWeight: '600' }}
        dateNameStyle={{ color: '#8B5E3C', fontSize: 10, textTransform: 'uppercase' }}
        dayContainerStyle={{ backgroundColor: 'white', borderRadius: 12, marginHorizontal: 5 }}

        highlightDateContainerStyle={{ backgroundColor: '#8B4513' }}
        highlightDateNumberStyle={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}
        highlightDateNameStyle={{ color: 'white', fontSize: 10, textTransform: 'uppercase' }}

        locale={{ name: 'vi', config: {} }}
        markedDates={markedDates}

        selectedDate={selectedDate}
        onDateSelected={(date) => setSelectedDate(moment(date))}
      />

      <FlatList
        className="grow-0"
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerClassName="pt-2 grow-0"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-2">
            <Text className="text-[#8B5E3C] opacity-60 text-lg italic">
              Không có lịch học
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default MyCalendar;