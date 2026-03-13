import { View, Text, Pressable } from 'react-native';
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';
import { BookingSlot } from '../../../utils/CoachBookingType';
import dayjs from 'dayjs';

type Props = {
  bookingSlots: BookingSlot[];
};

const BookingTable = ({ bookingSlots }: Props) => {
  return (
    <View className="flex-col gap-2 pb-5 mx-4 mt-4">
      <View className="w-full">
        {/* Header */}
        <View className="flex-row gap-4 mb-2">
          <Text className="w-10 text-foreground font-medium text-center">
            STT
          </Text>
          <Text className="w-40 text-foreground font-medium">Ngày</Text>
          <Text className="grow text-foreground font-medium text-center">
            Thời gian
          </Text>
          <View className="w-8" />
        </View>

        {/* Body */}
        <View className="flex-col gap-2">
          {bookingSlots.map((slot, index) => {
            return (
              <Pressable
                key={`${slot.date}-${slot.startTime}-${slot.endTime}`}
                className="flex-row gap-4 border-t border-background-sub1 pt-2 items-center"
              >
                <Text className="w-10 text-secondaryText font-medium text-center">
                  {index + 1}
                </Text>
                <Text className="w-40 text-secondaryText font-medium">
                  {dayjs(slot.date).format('DD/MM/YYYY')}
                </Text>
                <Text className="grow text-secondaryText font-medium text-center">
                  {slot.startTime} - {slot.endTime}
                </Text>
                <Pressable className="rounded-lg bg-danger-20 p-1.5 z-10">
                  <Ionicons
                    name="trash"
                    size={18}
                    color={colors.danger.DEFAULT}
                  />
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default BookingTable;
