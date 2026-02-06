import React from 'react';
import { Image, View, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const ImageProgram = (
  { imgUrl, programName }: { imgUrl: string; programName: string }
) => {
  return (
    <View className="w-full h-[40%] overflow-hidden relative">
      <Image
        source={{ uri: imgUrl }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />

      <LinearGradient
        colors={[
          'rgba(255,250,240,0)', 
          'rgba(255,250,240,0.8)',
          'rgba(255,250,240,1)', 
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '40%',
        }}
      />

      <Text className="absolute bottom-6 left-6 text-foreground font-bold text-2xl">
        {programName}
      </Text>
    </View>
  );
};

export default ImageProgram;
