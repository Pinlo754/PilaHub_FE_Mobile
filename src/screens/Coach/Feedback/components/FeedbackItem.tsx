import React from 'react';
import { View, Text, Image } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons'; 

interface FeedbackProps {
  userName: string;
  userImage: string;
  rating: number;
  feedbackContent: string;
  date?: string;
}

const FeedbackItem = ({
  userName,
  userImage,
  rating,
  feedbackContent,
  date = "22 Jul"
}: FeedbackProps) => {

  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={18}
        color={index < rating ? "#f1c40f" : "#d1d1d1"}
        style={{ marginLeft: 2 }}
      />
    ));
  };

  return (
    <View className="bg-[#fdf2d9] rounded-[25px] p-4 mb-4 shadow-sm mx-4">

      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <Image
            source={{ uri: userImage }}
            className="w-12 h-12 rounded-full border-2 border-gray-200"
          />

          <View className="ml-3 flex-row items-center">
            <Text className="font-bold text-[#4a3f35] text-base">{userName}</Text>
            <Text className="text-gray-500 mx-1"> • </Text>
            <Text className="text-gray-500">{date}</Text>

            <View className="ml-2 bg-[#0095f6] rounded-full p-[2px]">
              <Ionicons name="checkmark" size={10} color="white" />
            </View>
          </View>
        </View>

        {/* Stars */}
        <View className="flex-row">
          {renderStars()}
        </View>
      </View>

      {/* Content */}
      <View className="pr-2">
        <Text className="text-[#a67c52] text-lg leading-6 font-medium">
          {feedbackContent}
        </Text>
      </View>

      {/* Info icon */}
      <View className="absolute bottom-4 right-4 bg-transparent">
        <Ionicons name="information-circle" size={24} color="#a67c52" />
      </View>
    
    </View>
  );
};

export default FeedbackItem;
