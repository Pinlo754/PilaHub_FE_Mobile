import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { errorMock } from '../../../mocks/summaryData';
import { ErrorItemType } from '../../../utils/SummaryType';
import ErrorItem from './ErrorItem';
import { colors } from '../../../theme/colors';

const ErrorSection = () => {
  // STATE
  const [activeErrorId, setActiveErrorId] = useState<number | null>(null);

  // HANDLERS
  const onToggle = (id: number) => {
    setActiveErrorId(prev => (prev === id ? null : id));
  };

  // RENDER
  const renderItem = useCallback(
    ({ item }: { item: ErrorItemType }) => {
      return (
        <ErrorItem
          item={item}
          expanded={activeErrorId === item.id}
          onPress={() => onToggle(item.id)}
        />
      );
    },
    [activeErrorId],
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
          style={{ width: 30, height: 30, backgroundColor: colors.danger[20] }}
        >
          <Text className="color-danger font-semibold text-xl">
            {errorMock.length}
          </Text>
        </View>
      </View>

      {/* List Section */}
      <FlatList
        data={errorMock}
        keyExtractor={item => item.id.toString()}
        scrollEnabled={false}
        renderItem={renderItem}
      />
    </View>
  );
};

export default ErrorSection;
