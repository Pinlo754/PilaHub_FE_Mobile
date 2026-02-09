import { Pressable, Text, View } from 'react-native';
import { ListTab } from '../../../constants/listTab';

const TABS = [
  { id: ListTab.Exercise, label: 'Bài tập' },
  { id: ListTab.Course, label: 'Khóa học' },
];

type Props = {
  tabId: ListTab;
  onChange: (tab: ListTab) => void;
};

const Tabs = ({ tabId, onChange }: Props) => {
  return (
    <View className="flex-row items-center justify-center mt-2 gap-1">
      {TABS.map(tab => {
        const isActive = tabId === tab.id;

        return (
          <Pressable
            key={tab.id}
            className={`flex items-center w-24 border-b-2 ${
              isActive ? 'border-foreground' : 'border-transparent'
            }`}
            onPress={() => onChange(tab.id)}
          >
            <Text className="text-lg font-semibold color-foreground">
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default Tabs;
