import { Text, View } from 'react-native';
import Tabs from './Tabs';
import { ExerciseTab } from '../../../constants/exerciseTab';
import Description from './Description';
import { ExerciseType, PackageType } from '../../../utils/ExerciseType';
import Footer from './Footer';
import PlayButton from './PlayButton';
import { WorkoutSessionType } from '../../../utils/WorkoutSessionType';

type Props = {
  activeTab: ExerciseTab;
  exerciseDetail: ExerciseType;
  onChangeTab: (tab: ExerciseTab) => void;
  isVideoPlay: boolean;
  togglePlayButton: () => void;
  isPracticeTab: boolean;
  onPressAIPractice: () => void;
  canPractice: boolean;
  onPressPractice: () => void;
  activePackage: PackageType | null;
  workoutHistory: WorkoutSessionType[];
  canPlayTheory: boolean;
  fetchAISummary: (workoutSessionId: string, recordUrl: string) => void;
  hasAccess: boolean;
  isFromList: boolean;
  isFromSearch: boolean;
};

const OverviewSection = ({
  hasAccess,
  activeTab,
  exerciseDetail,
  onChangeTab,
  isVideoPlay,
  togglePlayButton,
  isPracticeTab,
  onPressAIPractice,
  canPractice,
  onPressPractice,
  activePackage,
  workoutHistory,
  canPlayTheory,
  fetchAISummary,
  isFromList,
  isFromSearch,
}: Props) => {
  return (
    <View
      className={`absolute px-4 pb-6 w-full bottom-0 flex bg-background ${isPracticeTab ? 'h-[55%] rounded-t-3xl' : 'h-[50%]'}`}
    >
      {/* Play Button */}
      {!isPracticeTab && (
        <PlayButton
          isVideoPlay={isVideoPlay}
          togglePlayButton={togglePlayButton}
          hasAccess={hasAccess}
        />
      )}

      {/* Name */}
      <Text
        className={`text-center text-2xl font-bold color-foreground ${!canPlayTheory || isPracticeTab ? 'mt-5' : 'mt-2'}`}
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
        workoutHistory={workoutHistory}
        canPlayTheory={canPlayTheory}
        fetchAISummary={fetchAISummary}
        isFromList={isFromList}
      />

      {/* Btn */}
      {isPracticeTab && canPractice && (
        <Footer
          onPress={onPressPractice}
          onPressAIPractice={onPressAIPractice}
          activePackage={activePackage}
          hasAccess={hasAccess}
          isFromList={isFromList}
          isFromSearch={isFromSearch}
        />
      )}
    </View>
  );
};

export default OverviewSection;
