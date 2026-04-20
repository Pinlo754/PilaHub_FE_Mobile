import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { FilterOptions } from '../useSearchScreen';
import { LevelType } from '../../../utils/CourseType';
import { getLevelLabel } from '../../../utils/uiMapper';
import Button from '../../../components/Button';

const LEVELS: LevelType[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

type Props = {
  visible: boolean;
  currentFilter: FilterOptions;
  onApply: (options: FilterOptions) => void;
  onClose: () => void;
};

const FilterModal = ({ visible, currentFilter, onApply, onClose }: Props) => {
  const [selected, setSelected] = useState<LevelType | null>(
    currentFilter.level,
  );

  useEffect(() => {
    setSelected(currentFilter.level);
  }, [visible]);

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable className="flex-1 justify-end" onPress={onClose}>
        <Pressable
          className="bg-background rounded-t-3xl px-6 pt-6 pb-10"
          onPress={e => e.stopPropagation()}
        >
          {/* Title */}
          <Text className="text-foreground text-xl font-bold mb-5">
            Lọc theo độ khó
          </Text>

          {/* Level options */}
          <View className="flex-col gap-3 mb-6">
            {LEVELS.map(level => {
              const isActive = selected === level;
              return (
                <Pressable
                  key={level}
                  onPress={() =>
                    setSelected(prev => (prev === level ? null : level))
                  }
                  className={`flex-row items-center gap-3 border rounded-xl px-4 py-3 ${isActive ? 'border-foreground' : 'border-background-sub1'}`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isActive ? 'border-foreground' : 'border-background-sub1'}`}
                  >
                    {isActive && (
                      <View className="w-2.5 h-2.5 rounded-full bg-foreground" />
                    )}
                  </View>
                  <Text className={`font-semibold text-base text-foreground`}>
                    {getLevelLabel(level)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Buttons */}

          <View className="pt-2 flex-row justify-between">
            <View className="w-[46%]">
              <Button
                text="Xóa lọc"
                onPress={() => {
                  setSelected(null);
                  onApply({ level: null });
                }}
                colorType="sub2"
                rounded="xl"
              />
            </View>

            <View className="w-[46%]">
              <Button
                text="Áp dụng"
                onPress={() => onApply({ level: selected })}
                colorType="primary"
                rounded="xl"
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default FilterModal;
