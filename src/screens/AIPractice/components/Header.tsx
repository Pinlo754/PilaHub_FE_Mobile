import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import { useBle } from '../../../services/BleProvider';

type Props = {
  openInstructModal: () => void;
};

const Header = ({ openInstructModal }: Props) => {
  const { hr, status} = useBle();
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
        {/* <View className="flex-row items-center gap-2">
          <Ionicons name="time-outline" size={26} color={colors.foreground} />
          <Text className="color-foreground font-medium">02:35</Text>
        </View> */}
        <View />

        {/* Heart Rate - show global BLE HR from BleProvider. Tap to start/stop */}
        <Pressable
          onPress={() => {
            // if (status === 'connected' || status === 'receiving') disconnect();
            // else startScanForPolar();
          }}
          className="flex-row items-center gap-2"
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  status === 'receiving' || status === 'connected'
                    ? '#34D399'
                    : status === 'scanning' ||
                        status === 'connecting' ||
                        status === 'reconnecting'
                      ? '#F59E0B'
                      : '#EF4444',
              },
            ]}
          />
          <Ionicons
            name="fitness-outline"
            size={26}
            color={colors.danger.DEFAULT}
          />
          <Text className="color-foreground font-medium">
            {hr === null ? '--' : hr}{' '}
            <Text className="color-secondaryText text-sm font-medium">bpm</Text>
          </Text>
        </Pressable>
      </View>

      {/* Noti */}
      {/* <View className="absolute top-10 right-4 p-2 bg-background-sub1 rounded-lg flex-row gap-2 items-center">
        <Ionicons name="alert-circle" size={26} color={colors.danger.DEFAULT} />
        <Text className="color-foreground font-bold text-lg">
          Bạn đã tập sai tư thế!
        </Text>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  statusDot: { width: 10, height: 10, borderRadius: 6, marginRight: 6 },
});

export default Header;
