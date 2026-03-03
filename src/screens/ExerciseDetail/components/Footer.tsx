import { View } from 'react-native';
import Button from '../../../components/Button';

type Props = {
  onPress: () => void;
  onPressAIPractice: () => void;
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
    </>
  );
};

export default Footer;
