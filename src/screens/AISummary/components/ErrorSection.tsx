import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import ErrorItem from './ErrorItem';
import { colors } from '../../../theme/colors';

type ErrorLog = {
  bodyPart: string;
  side: string;
  recordedAtSecond: number;
  imageUrl: string;
};

type Props = {
  errors: ErrorLog[];
  openErrorVideo: (time: number) => void;
};

const ErrorSection = ({ errors, openErrorVideo }: Props) => {
  // STATE
  const [activeErrorIndex, setActiveErrorIndex] = useState<number | null>(null);

  // HANDLERS
  const onToggle = (index: number) => {
    setActiveErrorIndex(prev => (prev === index ? null : index));
  };

  // RENDER ITEM
  const renderItem = useCallback(
    ({ item, index }: { item: ErrorLog; index: number }) => {
      console.log('Error:', errors);
      console.log('Render ErrorItem:', index);
      return (
        <ErrorItem
          item={item}
          expanded={activeErrorIndex === index}
          onPress={() => onToggle(index)}
          onPlayVideo={openErrorVideo}
        />
      );
    },
    [activeErrorIndex, openErrorVideo],
  );

  return (
    <View className="m-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mt-2 mb-4">
        {/* Title */}
        <Text className="color-foreground font-bold text-xl">
          Các lỗi sai khi tập
        </Text>

        {/* Number of errors */}
        <View
          className="rounded-lg flex justify-center items-center"
          style={{
            width: 30,
            height: 30,
            backgroundColor: colors.danger[20],
          }}
        >
          <Text className="color-danger font-semibold text-xl">
            {errors.length}
          </Text>
        </View>
      </View>

      {/* List Section */}
      <FlatList
        data={errors}
        keyExtractor={(_, index) => index.toString()}
        scrollEnabled={false}
        renderItem={renderItem}
      />
    </View>
  );
};

export default ErrorSection;