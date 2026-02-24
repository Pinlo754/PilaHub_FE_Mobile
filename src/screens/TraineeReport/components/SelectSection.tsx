import { Pressable, Text, View } from 'react-native';
import { optionType } from '../../../constants/reportOption';

type Props = {
  options: optionType[];
  selectedOption: number;
  onChange: (option_id: number) => void;
};

const SelectSection = ({ options, selectedOption, onChange }: Props) => {
  return (
    <View className="mx-4">
      {options.map(op => {
        const isSelected = selectedOption === op.id;
        return (
          <Pressable
            key={op.id}
            className="flex-row items-center gap-2 mb-2"
            onPress={() => onChange(op.id)}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 border-foreground ${isSelected && 'bg-foreground'}`}
            />
            <Text className="color-foreground font-semibold text-lg">
              {op.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default SelectSection;
