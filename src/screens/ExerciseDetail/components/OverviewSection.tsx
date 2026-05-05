import { Text, View } from 'react-native';
import Tabs from './Tabs';
import { ExerciseTab } from '../../../constants/exerciseTab';
import Description from './Description';
import { ExerciseType, PackageType } from '../../../utils/ExerciseType';
import Footer from './Footer';
import PlayButton from './PlayButton';
import { ExerciseEquipment } from '../../../utils/EquipmentType';

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
  canPlayTheory: boolean;
  hasAccess: boolean;
  isFromList: boolean;
  isFromSearch: boolean;
  equipments: ExerciseEquipment[];
  isFromRoadmap: boolean;
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
  canPlayTheory,
  isFromList,
  isFromSearch,
  equipments,
  isFromRoadmap,
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
      {!isFromRoadmap && (
        <Tabs
          tabId={activeTab}
          onChange={onChangeTab}
          isVideoPlay={isVideoPlay}
        />
      )}

      {/* Description */}
      <Description
        exerciseDetail={exerciseDetail}
        isPracticeTab={isPracticeTab}
        canPlayTheory={canPlayTheory}
        isFromList={isFromList}
        equipments={equipments}
      />

      {/* Btn */}
      {isPracticeTab && canPractice && (
        <Footer
          onPress={onPressPractice}
          onPressAIPractice={onPressAIPractice}
          activePackage={activePackage}
          haveAIsupported={exerciseDetail.haveAIsupported}
          hasAccess={hasAccess}
          isFromList={isFromList}
          isFromSearch={isFromSearch}
        />
      )}
    </View>
  );
};

export default OverviewSection;
