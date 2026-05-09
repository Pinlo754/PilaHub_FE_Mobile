import React, { useState, useMemo, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, Pressable } from 'react-native';
import CalendarStrip from 'react-native-calendar-strip';
import moment from 'moment';
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { CoachService } from '../../../hooks/coach.service';

moment.locale('vi');

const monthNamesVi = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

type ScheduleItem = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  time: string;
  student: string;
  content?: string;
};

const MyCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<moment.Moment>(moment());
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();

  const handlePressSchedule = (id: string) => {
    if (route.name !== 'CommingsoonClass') {
      navigation.navigate('CommingsoonClass', { selectedId: id });
    } else {
      navigation.setParams({ selectedId: id });
    }
  };

  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await CoachService.getSchedules();
        const formattedData: ScheduleItem[] = response.map((item: any) => ({
          id: item.liveSessionId,
          date: item.coachBooking.startTime,
          startTime: item.coachBooking.startTime,
          endTime: item.coachBooking.endTime,
          time: `${moment(item.coachBooking.startTime).format('HH:mm')} - ${moment(item.coachBooking.endTime).format('HH:mm')}`,
          student: item.coachBooking.trainee.fullName,
          content: item.coachBooking.personalSchedule?.scheduleName || 'Không có nội dung',
        }));
        setScheduleData(formattedData);
      } catch (error) {
        console.log("Fetch schedule error:", error);
      }
    };
    fetchSchedule();
  }, []);

  const filteredData = useMemo(() => {
    return scheduleData.filter(item => moment(item.date).isSame(selectedDate, 'day'));
  }, [selectedDate, scheduleData]);

  const markedDates = useMemo(() => {
    return scheduleData.map(item => ({
      date: moment(item.date),
      dots: [{ color: '#D28C4A', selectedColor: 'white' }],
    }));
  }, [scheduleData]);

  const currentMonthVi = monthNamesVi[selectedDate.month()];
  const currentYear = selectedDate.year();

  const renderItem = ({ item }: { item: ScheduleItem }) => {
    const [start, end] = item.time.split(' - ');
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => handlePressSchedule(item.id)}>
        <View className="flex-row bg-[#FFF5E6] mx-4 my-2 rounded-2xl overflow-hidden">
          <View className="w-[85px] bg-[#D28C4A] justify-center items-center">
            <Text className="text-white font-bold text-lg leading-6">{start}</Text>
            <Text className="text-white font-bold text-lg leading-6">{end}</Text>
          </View>
          <View className="flex-1 px-4 py-2 justify-center">
            <Text className="text-[#8B5E3C] text-base mb-1" numberOfLines={1}>
              <Text className="font-bold">Học viên: </Text>{item.student}
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
    <View className="bg-[#F5DEB3] rounded-3xl pt-2 pb-4" style={{ maxHeight: 520 }}>
      <View className="flex-row justify-between items-center">
        <View className="pt-2 px-5 flex-row items-center">

        <Text className="text-2xl font-bold text-[#8B5E3C]">Lịch học</Text>
        <Text className="ml-2 text-xl text-[#8B5E3C]">🕒</Text>
       </View>

       <Pressable className="py-2 px-2 mr-2 flex-row items-center bg-background rounded-xl" onPress={() => navigation.navigate('CoachBooking')}>
        <Text className="text-xl font-semibold text-[#8B5E3C]">Lịch sử phiên học</Text>
      </Pressable>
      </View>
      {/* Header tháng tiếng Việt */}
      <View className="items-center py-1">
        <Text className="text-[#8B5E3C] text-[22px] font-bold">
          {currentMonthVi} {currentYear}
        </Text>
      </View>
        

      <CalendarStrip
        scrollable
        calendarAnimation={{ type: 'sequence', duration: 30 }}
        daySelectionAnimation={{ type: 'background', duration: 200, highlightColor: '#8B4513' }}
        
        style={{ height: 95, paddingTop: 8, paddingBottom: 8 }}
        calendarColor={'#F5DEB3'}
        scrollToOnSetSelectedDate={true}
        useIsoWeekday={false}

        // TẮT HOÀN TOÀN HEADER MẶC ĐỊNH
        headerTextContainerStyle={{ display: 'none' }}
        showMonth={false}                    // ← Thêm dòng này
        showDayName={true}
        showDate={true}

        dateNumberStyle={{ color: '#8B5E3C', fontSize: 14, fontWeight: '600' }}
        dateNameStyle={{ color: '#8B5E3C', fontSize: 11, textTransform: 'uppercase' }}
        dayContainerStyle={{ backgroundColor: 'white', borderRadius: 12, marginHorizontal: 4 }}
        highlightDateContainerStyle={{ backgroundColor: '#8B4513' }}
        highlightDateNumberStyle={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}
        highlightDateNameStyle={{ color: 'white', fontSize: 11, textTransform: 'uppercase' }}

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
        contentContainerClassName="pt-3"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-8">
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