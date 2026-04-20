import { Modal, Pressable, Text, View } from 'react-native';
import { WorkoutSessionType } from '../../../utils/WorkoutSessionType';
import { formatDateTime } from '../../../utils/day';
import { secondsToTime } from '../../../utils/time';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';
import Button from '../../../components/Button';

type Props = {
  session: WorkoutSessionType | null;
  onClose: () => void;
};

const WorkoutDetailModal = ({ session, onClose }: Props) => {
  if (!session) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!!session}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 justify-center items-center px-6"
        onPress={onClose}
      >
        {/* Overlay */}
        <View className="absolute inset-0 bg-black/40" />
        <Pressable
          className="bg-background w-full rounded-2xl p-5"
          onPress={e => e.stopPropagation()}
        >
          {/* Title */}
          <Text className="text-foreground text-lg font-bold mb-4 text-center">
            Chi tiết buổi tập
          </Text>

          {/* Rows */}
          {[
            { label: 'Bài tập', value: session.exerciseName },
            { label: 'Bắt đầu', value: formatDateTime(session.startTime) },
            {
              label: 'Kết thúc',
              value: session.endTime
                ? formatDateTime(session.endTime)
                : 'Chưa kết thúc',
            },
            {
              label: 'Thời lượng',
              value: secondsToTime(session.durationSeconds || 0),
            },
            {
              label: 'Tập với AI',
              value: session.haveAITracking ? 'Có' : 'Không',
            },
            {
              label: 'Thiết bị IOT',
              value: session.haveIOTDeviceTracking ? 'Có' : 'Không',
            },
          ].map(({ label, value }) => (
            <View
              key={label}
              className="flex-row justify-between py-2 border-b border-background-sub1"
            >
              <Text className="text-foreground font-semibold">{label}</Text>
              <Text className="text-secondaryText font-medium flex-shrink ml-4 text-right">
                {value}
              </Text>
            </View>
          ))}

          {/* Completed badge */}
          <View className="flex-row justify-between items-center py-2 border-b border-background-sub1">
            <Text className="text-foreground font-semibold">Hoàn thành</Text>
            {session.completed ? (
              <View className="flex-row items-center gap-1 bg-success-20 px-2 py-1 rounded-full">
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.success.DEFAULT}
                />
                <Text className="text-success font-semibold text-sm">
                  Đã hoàn thành
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1 bg-error-20 px-2 py-1 rounded-full">
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.danger.DEFAULT}
                />
                <Text className="text-error font-semibold text-sm">
                  Chưa hoàn thành
                </Text>
              </View>
            )}
          </View>

          {/* Close btn */}
          <View className="flex items-end mt-4">
            <Button
              text="Đóng"
              onPress={onClose}
              colorType="sub1"
              rounded="xl"
              width={100}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default WorkoutDetailModal;
