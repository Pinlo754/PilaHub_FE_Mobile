import Ionicons from '@react-native-vector-icons/ionicons';
import { View, Text, Modal, Pressable } from 'react-native';
import { colors } from '../../../theme/colors';
import { TRAINING_DAY_OPTIONS } from '../../../constants/trainingDayOption';
import Button from '../../../components/Button';
import { TrainingDay } from '../../../utils/CourseLessonProgressType';

type Props = {
  visible: boolean;
  onClose: () => void;
  handleSelectDay: (day: TrainingDay) => void;
  selectedDays: TrainingDay[];
  onPressRegister: () => void;
};

const ScheduleModal = ({
  visible,
  onClose,
  handleSelectDay,
  selectedDays,
  onPressRegister,
}: Props) => {
  // VARIABLE
  const isValid = selectedDays.length > 0;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 justify-center items-center">
        {/* Overlay */}
        <View className="absolute inset-0 bg-black/40" />

        {/* Modal */}
        <View
          className="rounded-3xl overflow-hidden bg-white pb-4"
          style={{ width: 350 }}
        >
          {/* Header */}
          <View className="bg-background-sub1 py-5">
            <Text className="font-semibold color-foreground text-2xl text-center">
              Tạo lịch tập
            </Text>

            <Pressable onPress={onClose} className="absolute right-3 top-3">
              <Ionicons
                name="close-outline"
                size={26}
                color={colors.inactive[80]}
              />
            </Pressable>
          </View>

          {/* Số buổi */}
          {/* <View className=" mx-4 mt-4 flex-row items-center gap-3 w-[160px] relative">
            <Text className="color-foreground font-semibold text-lg">
              Số buổi tập
            </Text>

            <Pressable
              onPress={() => {
                setOpenSelect(!openSelect);
              }}
              className="rounded-lg bg-background-sub1 py-2 px-2 flex-row gap-3 items-center justify-between my-1"
            >
              <Text className="color-foreground">
                {sessionPerWeek ? `${sessionPerWeek} buổi` : 'Chọn số buổi tập'}
              </Text>

              <Ionicons
                name="chevron-down-outline"
                size={16}
                color={colors.foreground}
              />
            </Pressable>

            {openSelect && (
              <ScrollView
                className="absolute w-[142px] max-h-[200px] rounded-md bg-background border border-foreground left-[94px] top-12 z-10"
                showsVerticalScrollIndicator={false}
              >
                {SESSION_OPTIONS.map((num, index) => (
                  <Pressable
                    key={num}
                    onPress={() => handleSelectPress(num)}
                    className={`p-2 ${
                      index !== 0 ? 'border-t border-background-sub1' : ''
                    }`}
                  >
                    <Text className="color-foreground font-medium">
                      {num} buổi
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View> */}

          {/* Chọn ngày */}
          <View className="flex-row justify-between mx-4 mt-6">
            {TRAINING_DAY_OPTIONS.map(day => {
              return (
                <Pressable
                  key={day.value}
                  onPress={() => handleSelectDay(day.value)}
                  className={`p-2 flex-col items-center rounded-lg relative border border-foreground  ${
                    selectedDays.includes(day.value) ? 'bg-background-sub1' : ''
                  }`}
                >
                  <Text className="color-foreground font-bold text-2xl">
                    {day.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Button */}
          <View className="flex self-center mt-8">
            <Button
              text="Xác nhận"
              onPress={onPressRegister}
              colorType={!isValid ? 'grey' : 'sub1'}
              rounded="lg"
              width={100}
              disabled={!isValid}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ScheduleModal;
