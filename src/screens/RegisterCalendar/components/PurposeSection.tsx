import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

type Props = {
  selectedPurpose: string | null;
  onPressPurpose: (purposeId: string | null) => void;
};

const PurposeSection = ({ selectedPurpose, onPressPurpose }: Props) => {
  // CONSTANTS
  const OPTIONS = [
    {
      id: '1',
      label: 'Tư vấn',
    },
    {
      id: '2',
      label: 'Hướng dẫn tập luyện',
    },
    {
      id: '3',
      label: 'Sửa lỗi',
    },
  ];

  return (
    <View className="m-4">
      {/* Title */}
      <View className="w-full rounded-full px-3 py-2 bg-background-sub1 flex-row gap-1 items-center">
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={colors.foreground}
        />
        <Text className="color-foreground font-medium">
          Mục đích đăng ký <Text className="color-danger-darker">*</Text>
        </Text>
      </View>

      {/* Options */}
      <View className="mt-3 ml-8 flex-col gap-3">
        {OPTIONS.map(option => {
          const isSelected = selectedPurpose === option.id;
          return (
            <Pressable
              key={option.id}
              className="flex-row items-center gap-2"
              onPress={() => onPressPurpose(option.id)}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 border-foreground ${isSelected && 'bg-foreground'}`}
              />
              <Text className="color-foreground font-semibold text-lg">
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default PurposeSection;
