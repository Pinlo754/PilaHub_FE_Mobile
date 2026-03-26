import { Text, View } from 'react-native';
import Tabs from './Tabs';
import { ExerciseTab } from '../../../constants/exerciseTab';
import Description from './Description';
import { ExerciseType, PackageType } from '../../../utils/ExerciseType';
import Footer from './Footer';
import PlayButton from './PlayButton';

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
};

const OverviewSection = ({
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
}: Props) => {
  return (
    <View
      className={`absolute px-4 pb-6 w-full bottom-0 flex bg-background ${!canPractice || isPracticeTab ? 'h-[55%] rounded-t-3xl' : 'h-[50%]'}`}
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
        className={`text-center text-2xl font-bold color-foreground ${!canPractice || isPracticeTab ? 'mt-5' : 'mt-2'}`}
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
      {isPracticeTab && canPractice && (
        <Footer
          onPress={onPressPractice}
          onPressAIPractice={onPressAIPractice}
          activePackage={activePackage}
        />
      )}
    </View>
  );
};

export default OverviewSection;
