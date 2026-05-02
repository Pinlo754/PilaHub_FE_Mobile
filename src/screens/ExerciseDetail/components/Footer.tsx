import { View } from 'react-native';
import Button from '../../../components/Button';
import { PackageType } from '../../../utils/ExerciseType';

type Props = {
  onPress: () => void;
  onPressAIPractice: () => void;
  activePackage: PackageType | null;
  haveAIsupported: boolean;
  hasAccess: boolean;
  canPractice: boolean;
  isFromList: boolean;
  isFromSearch: boolean;
};

const Footer = ({
  onPress,
  onPressAIPractice,
  activePackage,
  haveAIsupported,
  canPractice,
  isFromList,
  isFromSearch,
}: Props) => {
  const isVip = activePackage === PackageType.VIP_MEMBER;
  const isPaidUser =
    activePackage === PackageType.VIP_MEMBER ||
    activePackage === PackageType.MEMBER;

  const isPracticeDisabled = !canPractice;
  const isAIDisabled = !isVip || !haveAIsupported;

  return (
    <>
      <View className="pt-2 flex-row justify-between">
        <View className="w-[46%]">
          <Button
            text="Tự tập"
            onPress={onPress}
            disabled={isPracticeDisabled}
            colorType={isPracticeDisabled ? 'grey' : 'sub1'}
            rounded="xl"
            iconName="log-in-outline"
            iconSize={26}
          />
        </View>

        <View className="w-[46%]">
          <Button
            text="Tập với AI"
            onPress={onPressAIPractice}
            disabled={isAIDisabled}
            colorType={isAIDisabled ? 'grey' : 'sub1'}
            rounded="xl"
            iconName="sparkles-outline"
            iconSize={20}
          />
        </View>
      </View>
    </>
  );
};

export default Footer;
