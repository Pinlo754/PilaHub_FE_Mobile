import { View } from 'react-native';
import Button from '../../../components/Button';
import { PackageType } from '../../../utils/ExerciseType';

type Props = {
  onPress: () => void;
  onPressAIPractice: () => void;
<<<<<<< HEAD
};

const Footer = ({ onPress, onPressAIPractice }: Props) => {
  return (
    <>
      {/* <View className="pt-2">
        <Button
          text="Bắt đầu buổi tập"
          onPress={onPress}
          colorType="sub1"
          rounded="full"
          iconName="log-in-outline"
          iconSize={26}
        />
      </View> */}

      <View className="pt-2 flex-row justify-between">
        <View className="w-[46%]">
          <Button
            text="Tự tập"
=======
  activePackage: PackageType | null;
};

const Footer = ({ onPress, onPressAIPractice, activePackage }: Props) => {
  const isVip = activePackage === PackageType.VIP_MEMBER;

  return (
    <>
      {isVip ? (
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
>>>>>>> 12d4234c81ffd99881bdc36b75b812f7f020e8d4
            onPress={onPress}
            colorType="sub1"
            rounded="full"
            iconName="log-in-outline"
            iconSize={26}
          />
        </View>
<<<<<<< HEAD

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
=======
      )}
>>>>>>> 12d4234c81ffd99881bdc36b75b812f7f020e8d4
    </>
  );
};

export default Footer;
