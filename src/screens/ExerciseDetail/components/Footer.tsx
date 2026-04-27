import { View } from 'react-native';
import Button from '../../../components/Button';
import { PackageType } from '../../../utils/ExerciseType';

type Props = {
  onPress: () => void;
  onPressAIPractice: () => void;
  activePackage: PackageType | null;
  haveAIsupported: boolean;
  hasAccess: boolean;
  isFromList: boolean;
  isFromSearch: boolean;
};

const Footer = ({ onPress, onPressAIPractice, activePackage, haveAIsupported, isFromList,  isFromSearch}: Props) => {


  const isVip = activePackage === PackageType.VIP_MEMBER;
  const isPaidUser =
    activePackage === PackageType.VIP_MEMBER ||
    activePackage === PackageType.MEMBER;
  const isPracticeDisabled = (() => {    
    if (isFromList) return false; // luôn enable
    if (!haveAIsupported) return true;
    if (isFromSearch) return !isPaidUser; // chỉ disable nếu chưa mua gói

    return !isPaidUser; // fallback
  })();

  return (
    <>
      {/* {isVip ? ( */}
      <View className="pt-2 flex-row justify-between">
        <View className="w-[46%]">
          <Button
            text="Tự tập"
            onPress={onPress}
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
            colorType={isVip ? 'sub1' : 'grey'}
            rounded="xl"
            iconName="sparkles-outline"
            iconSize={20}
          />
        </View>
      </View>
      {/* ) : (
        <View className="pt-2">
          <Button
            text="Bắt đầu buổi tập"
            onPress={onPress}
            colorType="sub1"
            rounded="full"
            iconName="log-in-outline"
            iconSize={26}
          />
        </View>
      )} */}
    </>
  );
};

export default Footer;
