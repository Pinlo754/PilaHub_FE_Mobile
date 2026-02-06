import Ionicons from '@react-native-vector-icons/ionicons';
import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';

type ProgramInformationProps = {
  goal: string;
  target_trainee: string;
};

const ProgramInformation = ({
  goal,
  target_trainee,
}: ProgramInformationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className="w-full bg-background px-6">
      
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
            Thông tin khóa học
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
            <Text className="text-foreground text-fs14">
              {goal}
            </Text>
          </View>

          <View className="bg-background-sub2 mt-2 rounded-2xl p-4">
            <View className="mb-2 flex-row items-center">
              <Ionicons name="person" size={20} color="#A0522D" />
              <Text className="text-foreground text-fs16 font-bold ml-2">
                Đối tượng
              </Text>
            </View>
            <Text className="text-foreground text-fs14">
              {target_trainee}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

export default ProgramInformation;
