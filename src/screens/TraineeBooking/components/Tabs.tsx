import { Pressable, Text, View } from 'react-native';
import { BookingTab } from '../../../constants/bookingTab';

const TABS = [
  { id: BookingTab.Scheduled, label: 'Chưa mở' },
  { id: BookingTab.Ready, label: 'Đang mở' },
  { id: BookingTab.History, label: 'Lịch sử' },
];

type Props = {
  tabId: BookingTab;
  onChange: (tab: BookingTab) => void;
};

const Tabs = ({ tabId, onChange }: Props) => {
  return (
    <View className="flex-row items-center justify-center mt-2 mb-3 gap-1">
      {TABS.map(tab => {
        const isActive = tabId === tab.id;

        return (
          <Pressable
            key={tab.id}
            className={`flex items-center w-28 border-b-2 ${
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
