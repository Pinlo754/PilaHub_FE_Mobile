import { View } from 'react-native';
import Button from '../../../components/Button';
import { PackageType } from '../../../utils/ExerciseType';

type Props = {
  onPress: () => void;
  onPressAIPractice: () => void;
  activePackage: PackageType | null;
  haveAIsupported: boolean;
};

const Footer = ({ onPress, onPressAIPractice, activePackage, haveAIsupported }: Props) => {
  const isVip = activePackage === PackageType.VIP_MEMBER;

  return (
    <>
      {isVip && haveAIsupported ? (
        <View className="pt-2 flex-row justify-between">
          <View className="w-[46%]">
            <Button
              text="Tự tập"
              onPress={onPress}
              colorType="sub1"
              rounded="xl"
              iconName="log-in-outline"
              iconSize={26}
            />
          </View>

          <View className="w-[46%]">
            <Button
              text="Tập với AI"
              onPress={onPressAIPractice}
              colorType="sub1"
              rounded="xl"
              iconName="sparkles-outline"
              iconSize={20}
            />
          </View>
        </View>
      ) : (
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
      )}
    </>
  );
};

export default Footer;
