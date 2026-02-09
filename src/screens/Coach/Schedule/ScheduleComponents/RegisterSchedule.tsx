import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Calendar as CalendarIcon, Edit2 } from 'lucide-react-native';

//
// ===== CẤU HÌNH TIẾNG VIỆT =====
//
LocaleConfig.locales['vi'] = {
  monthNames: [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ],
  monthNamesShort: [
    'Th1',
    'Th2',
    'Th3',
    'Th4',
    'Th5',
    'Th6',
    'Th7',
    'Th8',
    'Th9',
    'Th10',
    'Th11',
    'Th12',
  ],
  dayNames: [
    'Chủ nhật',
    'Thứ hai',
    'Thứ ba',
    'Thứ tư',
    'Thứ năm',
    'Thứ sáu',
    'Thứ bảy',
  ],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  today: 'Hôm nay',
};

LocaleConfig.defaultLocale = 'vi';

//
// ===== DATE HELPERS =====
//
const today = new Date().toISOString().split('T')[0];

const tomorrow = new Date(Date.now() + 86400000)
  .toISOString()
  .split('T')[0];

const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString);

  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

//
// ===== TIME INPUT =====
//
const TimeInput = ({ label, time }: any) => (
  <View className="bg-[#F5E1B9] p-4 rounded-2xl mb-4 shadow-sm">
    <Text className="text-[#A66C33] font-bold mb-2 text-lg">
      {label}
    </Text>

    <View className="flex-row items-center">
      <TextInput
        className="bg-white border border-[#D4A373] rounded-lg px-1 py-2 w-12 text-center text-xl text-[#A66C33]"
        value={time.hour}
        keyboardType="numeric"
      />

      <Text className="mx-2 text-2xl font-bold text-[#A66C33]">
        :
      </Text>

      <TextInput
        className="bg-white border border-[#D4A373] rounded-lg px-1 py-2 w-12 text-center text-xl text-[#A66C33]"
        value={time.minute}
        keyboardType="numeric"
      />
    </View>
  </View>
);

//
// ===== MAIN COMPONENT =====
//
const RegisterSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(tomorrow);

  //
  // MARKED DATES LOGIC
  //
  const getMarkedDates = () => {
    const dates: any = {};

    // today style
    dates[today] = {
      customStyles: {
        container: {
          borderWidth: 1,
          borderColor: '#A66C33',
          borderRadius: 999,
        },
        text: {
          color: '#A66C33',
          fontWeight: 'bold',
        },
      },
    };

    // selected override
    if (selectedDate) {
      dates[selectedDate] = {
        customStyles: {
          container: {
            backgroundColor: '#D4A373',
            borderRadius: 999,
          },
          text: {
            color: '#ffffff',
            fontWeight: 'bold',
          },
        },
      };
    }

    return dates;
  };

  return (
    <ScrollView className="flex-1 bg-[#FFF9F0] p-5">
      {/* HEADER */}
      <View className="flex-row items-center mb-6">
        <Text className="text-[#A66C33] text-2xl font-bold mr-2">
          Đăng ký lịch
        </Text>

        <CalendarIcon size={24} color="#A66C33" />
      </View>

      <View className="flex-row justify-between">
        {/* CALENDAR */}
        <View className="w-[65%] bg-[#F5E1B9] rounded-3xl shadow-md">
          <View className="flex-row justify-between items-center px-4 pt-4">
            <View>
              <Text className="text-[#4A4A4A] text-xl font-bold">
                Chọn ngày
              </Text>

              <Text className="text-[#4A4A4A]">
                {formatDisplayDate(selectedDate)}
              </Text>
            </View>

            <Edit2 size={18} color="#4A4A4A" />
          </View>

          <Calendar
            current={selectedDate}
            onDayPress={(day) =>
              setSelectedDate(day.dateString)
            }
            markingType="custom"
            markedDates={getMarkedDates()}
            minDate={tomorrow}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',

              textSectionTitleColor: '#A66C33',
              dayTextColor: '#4A4A4A',

              arrowColor: '#A66C33',
              monthTextColor: '#A66C33',

              textDayFontSize: 12,
              textMonthFontSize: 14,
              textDayHeaderFontSize: 12,

              textDayStyle: {
                paddingTop: 3,
              },
            }}
          />
        </View>

        {/* TIME PICKER */}
        <View className="w-[34%]">
          <TimeInput
            label="Từ"
            time={{ hour: '09', minute: '00' }}
          />

          <TimeInput
            label="Đến"
            time={{ hour: '12', minute: '00' }}
          />

          <TouchableOpacity className="bg-[#D4A373] py-3 rounded-xl mt-2 shadow-sm active:bg-[#A66C33]">
            <Text className="text-white text-center font-bold text-lg">
              Đăng ký
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FOOTER */}
      <Text className="text-[#A66C33] text-2xl font-bold mt-8 mb-4">
        Lịch hiện tại
      </Text>

      <View className="bg-[#F5E1B9] h-40 rounded-3xl shadow-inner" />
    </ScrollView>
  );
};

export default RegisterSchedule;
