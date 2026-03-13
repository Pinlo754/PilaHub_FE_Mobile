import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Calendar as CalendarIcon, Edit2 } from 'lucide-react-native';
import { CoachService } from '../../../../hooks/coach.service';

import { useEffect } from 'react';
import Toast from '../../../../components/Toast';
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

const formatTime = (iso: string) => {
  const date = new Date(iso);

  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (iso: string) => {
  const date = new Date(iso);

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const isWithin24Hours = (startIso: string) => {
  const now = new Date().getTime();
  const start = new Date(startIso).getTime();

  const diffHours = (start - now) / (1000 * 60 * 60);

  return diffHours < 24;
};



const TimeOffCard = ({ item }: any) => {
  return (
    <View className="bg-[#F5E1B9] rounded-2xl p-4 mb-3 shadow-sm">

      <View className="flex-row justify-between mb-2">
        <Text className="text-[#A66C33] font-bold text-lg">
          {formatDate(item.startTime)}
        </Text>

        <Text className="text-[#4A4A4A] font-semibold">
          {formatTime(item.startTime)} - {formatTime(item.endTime)}
        </Text>
      </View>

      <Text className="text-[#4A4A4A]">
        {item.reason}
      </Text>

    </View>
  );
};

//
// ===== TIME INPUT =====
//
const TimeInput = ({ label, time, onChange }: any) => (
  <View className="bg-[#F5E1B9] p-4 rounded-2xl mb-4 shadow-sm">
    <Text className="text-[#A66C33] font-bold mb-2 text-lg">
      {label}
    </Text>

    <View className="flex-row items-center">
      <TextInput
        className="bg-white border border-[#D4A373] rounded-lg px-1 py-2 w-12 text-center text-xl text-[#A66C33]"
        value={time.hour}
        keyboardType="numeric"
        onChangeText={(text) =>
          onChange({ ...time, hour: text })
        }
      />

      <Text className="mx-2 text-2xl font-bold text-[#A66C33]">
        :
      </Text>

      <TextInput
        className="bg-white border border-[#D4A373] rounded-lg px-1 py-2 w-12 text-center text-xl text-[#A66C33]"
        value={time.minute}
        keyboardType="numeric"
        onChangeText={(text) =>
          onChange({ ...time, minute: text })
        }
      />
    </View>
  </View>
);

//
// ===== MAIN COMPONENT =====
//
const RegisterSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(tomorrow);

  const [timeFrom, setTimeFrom] = useState({
    hour: '09',
    minute: '00',
  });

  const [timeTo, setTimeTo] = useState({
    hour: '12',
    minute: '00',
  });

  const [reason, setReason] = useState('');

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


  const [timeOffList, setTimeOffList] = useState<any[]>([]);

  const loadTimeOff = async () => {
    try {
      const res = await CoachService.getTimeOff();

      setTimeOffList(res);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadTimeOff();
  }, []);

  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, message, type });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2500);
  };

  return (
    <View className="flex-1 bg-[#FFF9F0]">
      <ScrollView className="flex-1 bg-[#FFF9F0] p-5 pn-10">
        {/* HEADER */}
        <View className="flex-row items-center mb-6">
          <Text className="text-[#A66C33] text-2xl font-bold mr-2">
            Đăng ký lịch
          </Text>

          <CalendarIcon size={24} color="#A66C33" />
        </View>

        <View className="flex-row justify-between">
          {/* CALENDAR */}
          <View className="w-[100%] bg-[#F5E1B9] rounded-3xl shadow-md">
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

                textDayFontSize: 16,
                textMonthFontSize: 20,
                textDayHeaderFontSize: 16,

                textDayStyle: {
                  paddingTop: 3,
                },
              }}
            />
          </View>
        </View>

        {/* TIME PICKER */}
        <View className="flex flex-row gap-4 justify-between mt-4">
          <View className='flex w-[48%] justify-center'>
            <TimeInput
              label="Từ"
              time={timeFrom}
              onChange={setTimeFrom}
            />
          </View>

          <View className='flex w-[48%] justify-center'>
            <TimeInput
              label="Đến"
              time={timeTo}
              onChange={setTimeTo}
            />
          </View>
        </View>

        <View>
          <View className="bg-[#F5E1B9] p-4 rounded-2xl mb-4 shadow-sm">
            <Text className="text-[#A66C33] font-bold mb-2 text-lg">
              Lý do
            </Text>

            <TextInput
              placeholder="Nhập lý do xin nghỉ..."
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              className="bg-white border border-[#D4A373] rounded-lg px-3 py-2 text-[#A66C33] h-20 text-start"
            />
          </View>
          <TouchableOpacity className="bg-[#D4A373] py-3 rounded-xl mt-2 shadow-sm active:bg-[#A66C33]"
            onPress={async () => {
              const startTime = `${selectedDate}T${timeFrom.hour}:${timeFrom.minute}:00Z`;
              const endTime = `${selectedDate}T${timeTo.hour}:${timeTo.minute}:00Z`;
              const isWorkingHours = (hour: string, minute: string) => {
                const h = parseInt(hour);
                const m = parseInt(minute);

                const totalMinutes = h * 60 + m;

                const startWork = 6 * 60;   // 06:00
                const endWork = 20 * 60;    // 20:00

                return totalMinutes > startWork || totalMinutes < endWork;
              };

              if (
                isWorkingHours(timeFrom.hour, timeFrom.minute) ||
                isWorkingHours(timeTo.hour, timeTo.minute)
              ) {
                showToast(
                  "Chỉ đăng ký nghỉ trong giờ làm việc (06:00 - 20:00)",
                  "error"
                );
                return;
              }
              if (isWithin24Hours(startTime)) {
                showToast(
                  "Không thể đăng ký. Chỉ được đăng ký nghỉ trước ít nhất 24 giờ",
                  "error"
                );
                return;
              }

              if (new Date(endTime) <= new Date(startTime)) {
                showToast(
                  "Không thể đăng ký. Giờ kết thúc phải sau giờ bắt đầu",
                  "error"
                );
                return;
              }

              if (!reason.trim()) {
                showToast(
                  "Vui lòng nhập lý do xin nghỉ",
                  "error"
                );
                return;
              }

              const payload = {
                startTime,
                endTime,
                reason,
              };

              console.log('Payload:', payload);

              try {
                const res = await CoachService.timeOff(payload);
                console.log('Success:', res);
              } catch (error) {
                console.log('Error:', error);
              }
            }}>
            <Text className="text-white text-center font-bold text-lg">
              Đăng ký
            </Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <Text className="text-[#A66C33] text-2xl font-bold mt-8 mb-4">
          Lịch nghỉ đã được duyệt
        </Text>

        <View className='mb-10'>
          {timeOffList.length === 0 ? (
            <Text className="text-gray-400 text-center">
              Chưa có lịch nghỉ
            </Text>
          ) : (
            timeOffList.map((item) => (
              <TimeOffCard key={item.id} item={item} />
            ))
          )}
        </View>

      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
      />
    </View>
  );
};

export default RegisterSchedule;
