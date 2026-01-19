import { Text, View } from 'react-native';
import Tabs from './Tabs';
import { ExerciseTab } from '../../../constants/exerciseTab';
import Description from './Description';

type Props = {
  activeTab: ExerciseTab;
  onChangeTab: (tab: ExerciseTab) => void;
};

const Content = ({ activeTab, onChangeTab }: Props) => {
  return (
    <View className="absolute px-4 w-full bottom-0 h-[50%] bg-background rounded-t-3xl">
      {/* Name */}
      <Text className="text-center text-2xl font-bold color-foreground mt-4">
        Động tác cơ bản
      </Text>

      {/* Tabs */}
      <Tabs tabId={activeTab} onChange={onChangeTab} />

      {/* Description */}
      <Description tabId={activeTab}/>
    </View>
  );
};

export default Content;
