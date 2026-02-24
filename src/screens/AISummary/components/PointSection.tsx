import React from 'react';
import { View, Text } from 'react-native';
import { ProgressSemicircle } from './ProgressSemicircle';
import { getPointContent } from '../../../utils/uiMapper';

type Props = {
  point: number;
  isPass: boolean;
};

const PointSection = ({ point, isPass }: Props) => {
  // GET
  const { title, desc } = getPointContent(point);

  return (
    <View className="bg-background-sub2 mx-4 mt-3 p-6 rounded-2xl shadow-lg elevation-lg items-center">
      <ProgressSemicircle progress={point} isPass={isPass} />

      <Text
        className={`text-4xl font-extrabold ${isPass ? 'color-success' : 'color-danger'}`}
      >
        {title}
      </Text>

      <Text
        className={`text-2xl font-bold mt-1 ${isPass ? 'color-success' : 'color-danger'}`}
      >
        {desc}
      </Text>
    </View>
  );
};

export default PointSection;
