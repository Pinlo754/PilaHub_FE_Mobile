import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';

type Props = {
  openInstructModal: () => void;
};

const Header = ({ openInstructModal }: Props) => {
  return (
    <View className="px-4">
      {/* Title */}
      <Text className="color-foreground text-3xl font-bold text-center">
        PilaHub
      </Text>

      {/* Instruct Modal */}
      <Pressable
        onPress={openInstructModal}
        className="absolute right-4 top-1 z-10"
      >
        <Ionicons
          name="information-circle-outline"
          size={28}
          color={colors.foreground}
        />
      </Pressable>

      {/* Metric Section */}
      <View className="py-4 flex-row justify-between">
        {/* Time */}
        <View className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={26} color={colors.foreground} />
          <Text className="color-foreground font-medium">02:35</Text>
        </View>

        {/* Heart Rate */}
        <View className="flex-row items-center gap-2">
          <Ionicons
            name="fitness-outline"
            size={26}
            color={colors.danger.DEFAULT}
          />
          <Text className="color-foreground font-medium">
            68{' '}
            <Text className="color-secondaryText text-sm font-medium">bpm</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Header;
