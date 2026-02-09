import { FlatList, View } from 'react-native';
import { useCallback, useRef } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';
import { CoachType } from '../../../utils/CoachType';
import CardCoach from './CardCoach';

type Props = {
  data: CoachType[];
  navigation: NativeStackNavigationProp<RootStackParamList, 'RegisterCalendar'>;
  onPressCoach: (coachId: string) => void;
};

const List = ({ data, navigation, onPressCoach }: Props) => {
  // USE REF
  const listRef = useRef<FlatList>(null);

  // USE FOCUS EFFECT
  useFocusEffect(
    useCallback(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, []),
  );

  // RENDER
  const renderItem = useCallback(
    ({ item, index }: { item: CoachType; index: number }) => {
      return (
        <CardCoach
          item={item}
          isLast={index === data.length - 1}
          onPressCard={() =>
            navigation.navigate('CoachDetail', {
              coach_id: item.coach_id,
              selectedCoachId: item.coach_id,
            })
          }
          onPressBtn={() => {
            onPressCoach(item.coach_id);
          }}
        />
      );
    },
    [data.length, navigation, onPressCoach],
  );

  console.log('coach', data);

  return (
    <View className="w-full flex-1 gap-2">
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={item => item.coach_id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
};

export default List;
