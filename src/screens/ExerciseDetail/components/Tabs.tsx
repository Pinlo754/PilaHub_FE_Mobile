import { Pressable, Text, View } from 'react-native';
import { ExerciseTab } from '../../../constants/exerciseTab';

const TABS = [
  { id: ExerciseTab.Theory, label: 'Lý thuyết' },
  { id: ExerciseTab.Practice, label: 'Thực hành' },
];

type Props = {
  tabId: ExerciseTab;
  onChange: (tabId: ExerciseTab) => void;
  isVideoPlay: boolean;
};

const Tabs = ({ tabId, onChange, isVideoPlay }: Props) => {
  return (
    <View
      className={`mx-auto flex-row mt-4 rounded-full p-1.5 ${isVideoPlay ? 'bg-inactive-lighter' : 'bg-background-sub2'}`}
    >
      {TABS.map(tab => {
        const isActive = tab.id === tabId;
        return (
          <Pressable
            key={tab.id}
            className={`px-8 py-1.5 rounded-full ${isActive ? 'bg-foreground' : ''}`}
            onPress={() => onChange(tab.id)}
            disabled={isVideoPlay}
          >
            <Text
              className={`font-medium text-lg ${isActive ? 'text-white' : isVideoPlay ? 'text-inactive-darker' : 'text-secondaryText'}`}
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
