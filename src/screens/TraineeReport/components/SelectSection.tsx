import { Pressable, Text, View } from 'react-native';
import { ReportReasonType } from '../../../utils/ReportReasonType';

type Props = {
  reasons: ReportReasonType[];
  selectedReason: ReportReasonType | null;
  onChange: (reason: ReportReasonType) => void;
};

const SelectSection = ({ reasons, selectedReason, onChange }: Props) => {
  return (
    <View className="mx-4">
      {reasons.map(reason => {
        const isSelected =
          selectedReason?.reportReasonId === reason.reportReasonId;
        return (
          <Pressable
            key={reason.reportReasonId}
            className="flex-row items-center gap-2 mb-2"
            onPress={() => onChange(reason)}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 border-foreground ${isSelected && 'bg-foreground'}`}
            />
            <Text className="color-foreground font-semibold text-lg">
              {reason.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default SelectSection;
