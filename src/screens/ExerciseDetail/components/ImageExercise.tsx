import { Image, View } from 'react-native';

const ImageExercise = () => {
  return (
    <View className="w-full h-[53%] overflow-hidden">
      <Image
        source={{
          uri: 'https://cdn.mos.cms.futurecdn.net/RSRmmWZGBcNnLLynabFD2Z.jpg',
        }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  );
};

export default ImageExercise;
