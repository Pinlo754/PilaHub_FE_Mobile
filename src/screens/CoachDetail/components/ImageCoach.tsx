import React from 'react';
import { Image, View, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  imgUrl: string;
  coachName: string;
};

const ImageCoach = ({ imgUrl, coachName }: Props) => {
  return (
    <View className="w-full h-[320px] overflow-hidden relative">
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
        {coachName}
      </Text>
    </View>
  );
};

export default ImageCoach;
