import { Pressable, Text, View } from 'react-native';
import { SummaryTab } from '../../../constants/summaryTab';

const TABS = [
  { id: SummaryTab.Point, label: 'Điểm & Chỉ số' },
  { id: SummaryTab.Error, label: 'Các lỗi khi tập' },
];

type Props = {
  tabId: SummaryTab;
  onChange: (tab: SummaryTab) => void;
};

const Tabs = ({ tabId, onChange }: Props) => {
  return (
    <View className="flex-row items-center justify-center mt-2 mb-3 gap-1">
      {TABS.map(tab => {
        const isActive = tabId === tab.id;

        return (
          <Pressable
            key={tab.id}
            className={`flex items-center w-40 border-b-2 ${
              isActive ? 'border-foreground' : 'border-transparent'
            }`}
            onPress={() => onChange(tab.id)}
          >
            <Text
              numberOfLines={1}
              className={`text-lg font-semibold  ${
                isActive ? 'color-foreground' : 'color-secondaryText'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default Tabs;
