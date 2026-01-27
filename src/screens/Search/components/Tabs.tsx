import { Pressable, Text, View } from 'react-native';
import { SearchTab } from '../../../constants/searchTab';

const TABS = [
  { id: SearchTab.Exercise, label: 'Bài tập' },
  { id: SearchTab.Course, label: 'Khóa học' },
  { id: SearchTab.Coach, label: 'HLV' },
];

type Props = {
  tabId: SearchTab;
  onChange: (tab: SearchTab) => void;
};

const Tabs = ({ tabId, onChange }: Props) => {
  return (
    <View className="flex-row items-center justify-center mt-5 gap-1">
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
