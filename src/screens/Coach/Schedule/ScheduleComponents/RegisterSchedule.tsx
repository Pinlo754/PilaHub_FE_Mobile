import React, { useState, useEffect, } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Calendar as CalendarIcon, Edit2, ChevronDown } from 'lucide-react-native';
import { CoachService } from '../../../../hooks/coach.service';
import Toast from '../../../../components/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
// ===== CẤU HÌNH TIẾNG VIỆT =====
LocaleConfig.locales['vi'] = {
  monthNames: [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ],
  monthNamesShort: [
    'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6',
    'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12',
  ],
  dayNames: [
    'Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy',
  ],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  today: 'Hôm nay',
};
LocaleConfig.defaultLocale = 'vi';

// ===== DATE HELPERS =====
const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
  });
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const isWithin24Hours = (startIso: string) => {
  const now = new Date().getTime();
  const start = new Date(startIso).getTime();
  const diffHours = (start - now) / (1000 * 60 * 60);
  return diffHours < 24;
};

// Khởi tạo danh sách giờ tròn từ 06:00 đến 20:00
const WORKING_HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = (i + 6).toString().padStart(2, '0');
  return `${h}:00`;
});

// ===== COMPONENTS =====
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
      <Text className="text-[#4A4A4A]">{item.reason}</Text>
    </View>
  );
};

// ===== MAIN COMPONENT =====
const RegisterSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(tomorrow);

  const [timeFrom, setTimeFrom] = useState('09:00');
  const [timeTo, setTimeTo] = useState('12:00');
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const [reason, setReason] = useState('');
  const [timeOffList, setTimeOffList] = useState<any[]>([]);
  const [busyTimes, setBusyTimes] = useState<any[]>([]);
  // State mới để điều khiển việc Xem thêm / Thu gọn
  const [showAll, setShowAll] = useState(false);

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

  const getBusyTime = async () => {
    try {
      const idStr = await AsyncStorage.getItem('id');
      const currentId = idStr ? JSON.parse(idStr) : null;

      const startTime = dayjs(selectedDate)
        .startOf('day')
        .toISOString();

      const endTime = dayjs(selectedDate)
        .endOf('day')
        .toISOString();

      const res = await CoachService.getBusyTime(currentId, {
        startTime,
        endTime,
      });
      setBusyTimes(res);
      return res;
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getBusyTime();
  }, [selectedDate]);


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

  const getMarkedDates = () => {
    const dates: any = {};
    dates[today] = {
      customStyles: {
        container: { borderWidth: 1, borderColor: '#A66C33', borderRadius: 999 },
        text: { color: '#A66C33', fontWeight: 'bold' },
      },
    };
    if (selectedDate) {
      dates[selectedDate] = {
        customStyles: {
          container: { backgroundColor: '#D4A373', borderRadius: 999 },
          text: { color: '#ffffff', fontWeight: 'bold' },
        },
      };
    }
    return dates;
  };

  const handleSelectStart = (time: string) => {
    setTimeFrom(time);
    setOpenStart(false);
    validateSelection(time, timeTo);
  };

  const handleSelectEnd = (time: string) => {
    setTimeTo(time);
    setOpenEnd(false);
    validateSelection(timeFrom, time);
  };

  // Sử dụng dayjs để format hiển thị đúng GMT+7
  const formatTime = (iso: string) => {
    return dayjs(iso).format('HH:mm');
  };

  const formatDate = (iso: string) => {
    return dayjs(iso).format('DD/MM/YYYY');
  };

  // Kiểm tra 24h dựa trên thời gian thực tế (local time)
  const isWithin24Hours = (startIso: string) => {
    const now = dayjs();
    const start = dayjs(startIso);
    return start.diff(now, 'hour') < 24;
  };

  const validateSelection = (startTimeStr: string, endTimeStr: string) => {
    const startDayjs = dayjs(`${selectedDate} ${startTimeStr}`, "YYYY-MM-DD HH:mm");
    const endDayjs = dayjs(`${selectedDate} ${endTimeStr}`, "YYYY-MM-DD HH:mm");

    // 1. Kiểm tra logic giờ bắt đầu < kết thúc
    if (endDayjs.isBefore(startDayjs) || endDayjs.isSame(startDayjs)) {
      showToast("Giờ kết thúc phải sau giờ bắt đầu", "error");
      return false;
    }

    // 2. Kiểm tra giờ làm việc (06:00 - 20:00)
    const startHour = startDayjs.hour();
    const endHour = endDayjs.hour();
    if (startHour < 6 || startHour >= 20 || endHour < 6 || (endHour === 20 && endDayjs.minute() > 0) || endHour > 20) {
      showToast("Chỉ đăng ký nghỉ trong giờ làm việc (06:00 - 20:00)", "error");
      return false;
    }

    // 3. Kiểm tra quy tắc 24h
    if (isWithin24Hours(startDayjs.toISOString())) {
      showToast("Phải đăng ký nghỉ trước ít nhất 24 giờ", "error");
      return false;
    }

    // 4. KIỂM TRA TRÙNG LỊCH TRONG BUSYTIMES
    const startMs = startDayjs.valueOf();
    const endMs = endDayjs.valueOf();
    const conflictingEvent = busyTimes?.find(busy => {
      const busyStartMs = dayjs(busy.startTime).valueOf();
      const busyEndMs = dayjs(busy.endTime).valueOf();
      return startMs < busyEndMs && endMs > busyStartMs;
    });

    if (conflictingEvent) {
      const typeName = conflictingEvent.type === 'BOOKING' ? "lịch huấn luyện" : "lịch nghỉ";
      const timeString = `${dayjs(conflictingEvent.startTime).format('HH:mm')} - ${dayjs(conflictingEvent.endTime).format('HH:mm')}`;
      showToast(`Trùng với ${typeName} (${timeString})`, "error");
      return false;
    }

    return true;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      /* Offset này tùy thuộc vào độ cao của Header/Bottom Tab của bạn, thường là 64 hoặc 100 */
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View className="flex-1 bg-[#FFF9F0]">
        <ScrollView
          className="flex-1 bg-[#FFF9F0] p-5 pb-10"
          scrollEnabled={!openStart && !openEnd}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View className="flex-row items-center mb-6">
            <Text className="text-[#A66C33] text-2xl font-bold mr-2">Đăng ký lịch</Text>
            <CalendarIcon size={24} color="#A66C33" />
          </View>

          <View className="flex-row justify-between mb-4">
            {/* CALENDAR */}
            <View className="w-[100%] bg-[#F5E1B9] rounded-3xl shadow-md z-0">
              <View className="flex-row justify-between items-center px-4 pt-4">
                <View>
                  <Text className="text-[#4A4A4A] text-xl font-bold">Chọn ngày</Text>
                  <Text className="text-[#4A4A4A]">{formatDisplayDate(selectedDate)}</Text>
                </View>
                <Edit2 size={18} color="#4A4A4A" />
              </View>

              <Calendar
                current={selectedDate}
                onDayPress={(day) => setSelectedDate(day.dateString)}
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
                  textDayStyle: { paddingTop: 3 },
                }}
              />
            </View>
          </View>

          {/* TIME PICKER UI - Z-Index cao để đè lên view phía dưới */}
          <View className="flex flex-row gap-4 justify-between mb-4 relative z-50" style={{ zIndex: 50, elevation: 5 }}>

            {/* Start Time */}
            <View className="bg-[#F5E1B9] rounded-2xl p-4 w-[48%] relative shadow-sm">
              <Text className="text-[#A66C33] font-bold mb-2 text-lg">Từ</Text>

              <Pressable
                onPress={() => {
                  setOpenStart(!openStart);
                  setOpenEnd(false);
                }}
                className="bg-white border border-[#D4A373] rounded-lg py-2 px-3 flex-row gap-3 items-center justify-between"
              >
                <Text className="text-[#A66C33] font-bold text-lg">{timeFrom}</Text>
                <ChevronDown size={18} color="#A66C33" />
              </Pressable>

              {openStart && (
                <ScrollView
                  className="absolute w-full max-h-[250px] rounded-md bg-background border border-foreground left-2 top-20 z-10"
                  showsVerticalScrollIndicator={false}
                >
                  {WORKING_HOURS.map((item, index) => (
                    <Pressable
                      key={`start-${item}`}
                      onPress={() => handleSelectStart(item)}
                      className={`p-2 ${index !== 0 ? 'border-t border-background-sub1' : ''
                        }`}
                    >
                      <Text className="text-[#4A4A4A] font-medium text-lg">{item}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* End Time */}
            <View className="bg-[#F5E1B9] rounded-2xl p-4 w-[48%] relative shadow-sm">
              <Text className="text-[#A66C33] font-bold mb-2 text-lg">Đến</Text>

              <Pressable
                onPress={() => {
                  setOpenEnd(!openEnd);
                  setOpenStart(false);
                }}
                className="bg-white border border-[#D4A373] rounded-lg py-2 px-3 flex-row gap-3 items-center justify-between"
              >
                <Text className="text-[#A66C33] font-bold text-lg">{timeTo}</Text>
                <ChevronDown size={18} color="#A66C33" />
              </Pressable>

              {openEnd && (
                <ScrollView
                  className="absolute w-full max-h-[250px] rounded-md bg-background border border-foreground left-2 top-20 z-10"
                  showsVerticalScrollIndicator={false}
                >
                  {WORKING_HOURS.map((item, index) => (
                    <Pressable
                      key={`end-${item}`}
                      onPress={() => handleSelectEnd(item)}
                      className={`p-2 ${index !== 0 ? 'border-t border-background-sub1' : ''
                        }`}
                    >
                      <Text className="text-[#4A4A4A] font-medium text-lg">{item}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          {/* REASON & SUBMIT */}
          <View className="z-0 relative" style={{ zIndex: 0, elevation: 0 }}>
            <View className="bg-[#F5E1B9] p-4 rounded-2xl mb-4 shadow-sm">
              <Text className="text-[#A66C33] font-bold mb-2 text-lg">Lý do</Text>
              <TextInput
                placeholder="Nhập lý do xin nghỉ..."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                className="bg-white border border-[#D4A373] rounded-lg px-3 py-2 text-[#A66C33] h-20 text-start"
              />
            </View>

            <TouchableOpacity
              className="bg-[#D4A373] py-3 rounded-xl mt-2 shadow-sm active:bg-[#A66C33]"
              onPress={async () => {
                // Tạo object dayjs từ ngày đã chọn và giờ đã chọn (mặc định hiểu là local time GMT+7)
                const startDayjs = dayjs(`${selectedDate} ${timeFrom}`, "YYYY-MM-DD HH:mm");
                const endDayjs = dayjs(`${selectedDate} ${timeTo}`, "YYYY-MM-DD HH:mm");

                const startTimeISO = startDayjs.toISOString();
                const endTimeISO = endDayjs.toISOString();

                // 1. Kiểm tra giờ làm việc (06:00 - 20:00)
                const startHour = startDayjs.hour();
                const endHour = endDayjs.hour();
                if (startHour < 6 || startHour >= 20 || endHour < 6 || (endHour === 20 && endDayjs.minute() > 0) || endHour > 20) {
                  showToast("Chỉ đăng ký nghỉ trong giờ làm việc (06:00 - 20:00)", "error");
                  return;
                }

                // 2. Kiểm tra quy tắc 24h
                if (isWithin24Hours(startTimeISO)) {
                  showToast("Phải đăng ký nghỉ trước ít nhất 24 giờ", "error");
                  return;
                }

                // 3. Kiểm tra logic giờ bắt đầu < kết thúc
                if (endDayjs.isBefore(startDayjs) || endDayjs.isSame(startDayjs)) {
                  showToast("Giờ kết thúc phải sau giờ bắt đầu", "error");
                  return;
                }

                if (!reason.trim()) {
                  showToast("Vui lòng nhập lý do xin nghỉ", "error");
                  return;
                }

                // 4. KIỂM TRA TRÙNG LỊCH TRONG BUSYTIMES (API trả về UTC)
                const startMs = startDayjs.valueOf();
                const endMs = endDayjs.valueOf();

                const conflictingEvent = busyTimes?.find(busy => {
                  const busyStartMs = dayjs(busy.startTime).valueOf();
                  const busyEndMs = dayjs(busy.endTime).valueOf();

                  // Thuật toán Overlap: (StartA < EndB) && (EndA > StartB)
                  return startMs < busyEndMs && endMs > busyStartMs;
                });

                if (conflictingEvent) {
                  const typeName = conflictingEvent.type === 'BOOKING' ? "lịch huấn luyện đã được đặt trước" : "lịch nghỉ đã đăng ký";
                  const timeString = `${dayjs(conflictingEvent.startTime).format('HH:mm')} - ${dayjs(conflictingEvent.endTime).format('HH:mm')}`;

                  showToast(`Trùng với ${typeName} (${timeString})`, "error");
                  return;
                }

                // 5. Gửi Payload
                try {
                  const payload = {
                    startTime: startTimeISO,
                    endTime: endTimeISO,
                    reason
                  };
                  await CoachService.timeOff(payload);
                  showToast("Đăng ký thành công!", "success");
                  loadTimeOff();
                  setReason('');
                  setShowAll(false);
                } catch (error) {
                  showToast("Có lỗi xảy ra khi đăng ký", "error");
                }
              }}
            >
              <Text className="text-white text-center font-bold text-lg">Đăng ký</Text>
            </TouchableOpacity>
          </View>

          {/* FOOTER - HIỂN THỊ DANH SÁCH LỊCH NGHỈ */}
          <Text className="text-[#A66C33] text-2xl font-bold mt-8 mb-4">
            Lịch nghỉ đã được duyệt
          </Text>

          <View className="mb-10 z-0">
            {timeOffList.length === 0 ? (
              <Text className="text-gray-400 text-center">Chưa có lịch nghỉ</Text>
            ) : (
              <>
                {/* Sao chép mảng, đảo ngược lấy mới nhất, rồi cắt ra 3 (nếu chưa xem thêm) */}
                {[...timeOffList]
                  .reverse()
                  .slice(0, showAll ? timeOffList.length : 3)
                  .map((item) => (
                    <TimeOffCard key={item.id} item={item} />
                  ))}

                {/* Nút Xem thêm / Thu gọn (chỉ hiển thị khi có >3 item) */}
                {timeOffList.length > 3 && (
                  <TouchableOpacity
                    className="py-3 mt-1 items-center bg-[#F5E1B9] rounded-xl"
                    onPress={() => setShowAll(!showAll)}
                  >
                    <Text className="text-[#A66C33] font-bold text-base">
                      {showAll ? 'Thu gọn' : `Xem thêm (${timeOffList.length - 3})`}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </ScrollView>

        <Toast visible={toast.visible} message={toast.message} type={toast.type} />
      </View>
    </KeyboardAvoidingView>
  );
};

export default RegisterSchedule;