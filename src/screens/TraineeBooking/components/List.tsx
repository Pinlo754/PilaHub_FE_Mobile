import { FlatList, View } from 'react-native';
import { useCallback, useRef } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useFocusEffect } from '@react-navigation/native';
import {
  BookingStatus,
  CoachBookingType,
} from '../../../utils/CoachBookingType';
import CardBooking from './CardBooking';
import EmptyData from './EmptyData';

type Props = {
  isLoading: boolean;
  data: CoachBookingType[];
  navigation: NativeStackNavigationProp<RootStackParamList, 'TraineeBooking'>;
  openDetailModal: (bookingId: string) => void;
  openFeedbackModal: (bookingId: string) => void;
};

const List = ({
  isLoading,
  data,
  navigation,
  openDetailModal,
  openFeedbackModal,
}: Props) => {
  // USE REF
  const listRef = useRef<FlatList>(null);

  // USE FOCUS EFFECT
  useFocusEffect(
    useCallback(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, []),
  );

  // RENDER
  const renderItem = ({ item }: { item: CoachBookingType }) => {
    const handlePress = (status: BookingStatus) => {
      switch (status) {
        case 'READY':
        case 'IN_PROGRESS':
          navigation.navigate('VideoCall', { bookingId: item.id });
          break;

        case 'COMPLETED':
          openFeedbackModal(item.id);
          break;

        default:
          break;
      }
    };

    const handlePressCard = (status: BookingStatus) => {
      switch (status) {
        case 'READY':
        case 'IN_PROGRESS':
          break;

        case 'CANCELLED_BY_COACH':
        case 'CANCELLED_BY_TRAINEE':
        case 'NO_SHOW_BY_COACH':
        case 'NO_SHOW_BY_TRAINEE':
        case 'REFUNDED':
        case 'SCHEDULED':
        case 'COMPLETED':
          openDetailModal(item.id);
          break;

        default:
          break;
      }
    };

    return (
      <CardBooking
        item={item}
        onPressBtn={() => handlePress(item.status)}
        onPressCard={() => handlePressCard(item.status)}
      />
    );
  };

  return (
    <View className="w-full flex-1 gap-2">
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        ListEmptyComponent={isLoading ? null : <EmptyData />}
      />
    </View>
  );
};

export default List;
