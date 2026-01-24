import { Text, View } from 'react-native';
import Tabs from './Tabs';
import { ExerciseTab } from '../../../constants/exerciseTab';
import Description from './Description';
import { ExerciseType } from '../../../utils/ExerciseType';
import Footer from './Footer';
import PlayButton from './PlayButton';

type Props = {
  activeTab: ExerciseTab;
  exerciseDetail: ExerciseType;
  onChangeTab: (tab: ExerciseTab) => void;
  isVideoPlay: boolean;
  togglePlayButton: () => void;
  toggleVideoExpand: () => void;
  isPracticeTab: boolean;
};

const OverviewSection = ({
  activeTab,
  exerciseDetail,
  onChangeTab,
  isVideoPlay,
  togglePlayButton,
  toggleVideoExpand,
  isPracticeTab,
}: Props) => {
  return (
    <View
      className={`absolute px-4 w-full bottom-0 flex bg-background ${isPracticeTab ? 'h-[55%] rounded-t-3xl' : 'h-[50%]'}`}
    >
      {/* Play Button */}
      {!isPracticeTab && (
        <PlayButton
          isVideoPlay={isVideoPlay}
          togglePlayButton={togglePlayButton}
        />
      )}

      {/* Name */}
      <Text
        className={`text-center text-2xl font-bold color-foreground ${isPracticeTab ? 'mt-5' : 'mt-2'}`}
      >
        {exerciseDetail.name}
      </Text>

      {/* Tabs */}
      <Tabs
        tabId={activeTab}
        onChange={onChangeTab}
        isVideoPlay={isVideoPlay}
      />

      {/* Description */}
      <Description
        exerciseDetail={exerciseDetail}
        isPracticeTab={isPracticeTab}
      />

      {/* Btn */}
      {isPracticeTab && <Footer onPress={toggleVideoExpand} />}
    </View>
  );
};

export default OverviewSection;
