import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import Ionicons from '@react-native-vector-icons/ionicons'; 
import { useNavigation } from "@react-navigation/native";

const Header = () => {
  const navigation = useNavigation();

  return (
    <View className="pb-4 pt-6 flex-row items-center justify-center relative">

      {/* Back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="absolute left-4"
      >
        <Ionicons name="arrow-back" size={24} color="#A0522D" />
      </TouchableOpacity>

      {/* Title */}
      <Text className="text-foreground text-2xl font-bold text-center">
        PilaHub
      </Text>

    </View>
  );
};

export default Header;
