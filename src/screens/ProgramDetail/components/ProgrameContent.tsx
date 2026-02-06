import Ionicons from '@react-native-vector-icons/ionicons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const ProgrameContent = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View className="w-full bg-background px-6 mt-4">
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        className="w-full bg-background-sub1 py-2 px-4 rounded-3xl flex-row justify-between items-center"
      >
        <View className="flex-row items-center">
          <Ionicons
            name="information-circle-outline"
            size={28}
            color="#A0522D"
          />
          <Text className="text-foreground text-fs16 font-medium ml-2">
            Lộ trình tập
          </Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={28}
          color="#A0522D"
        />
      </Pressable>

      {isOpen && (
        <>
          <View className="bg-background-sub2 mt-2 rounded-2xl p-4">
            <View className="mb-2 flex-row items-center">
              <Ionicons name="rocket-sharp" size={20} color="#A0522D" />
              <Text className="text-foreground text-fs16 font-bold ml-2">
                Mục tiêu
              </Text>
            </View>
            <Text className="text-foreground text-fs14"></Text>
          </View>

          <View className="bg-background-sub2 mt-2 rounded-2xl p-4">
            <View className="mb-2 flex-row items-center">
              <Ionicons name="person" size={20} color="#A0522D" />
              <Text className="text-foreground text-fs16 font-bold ml-2">
                Đối tượng
              </Text>
            </View>
            <Text className="text-foreground text-fs14"></Text>
          </View>
        </>
      )}
    </View>
  );
};
export default ProgrameContent;
