import Ionicons from '@react-native-vector-icons/ionicons';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { colors } from '../../../theme/colors';
import { useMemo, useState } from 'react';
import Button from '../../../components/Button';
import {
  getAvailableEndTimes,
  getAvailableStartSlots,
} from '../../../utils/availableSchedule';
import { BookingSlot } from '../../../utils/CoachBookingType';

type Slot = {
  start: string;
  end: string;
};

type Props = {
  slots: Slot[];
  startTime: string | null;
  endTime: string | null;
  onSelectStart: (time: string) => void;
  onSelectEnd: (time: string) => void;
  onPressConfirmSlot: () => void;
  bookingSlots: BookingSlot[];
};

const ChooseTime = ({
  slots,
  endTime,
  onSelectEnd,
  onSelectStart,
  startTime,
  onPressConfirmSlot,
  bookingSlots,
}: Props) => {
  // STATE
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  // HANDLERS
  const handleSelectStart = (time: string) => {
    onSelectStart(time);
    onSelectEnd(null as any);
    setOpenStart(false);
  };

  const handleSelectEnd = (time: string) => {
    onSelectEnd(time);
    setOpenEnd(false);
  };

  // CHECK
  const isValid = !!startTime && !!endTime;

  // CALC
  const startSlots = useMemo(() => {
    return getAvailableStartSlots(slots, bookingSlots);
  }, [slots, bookingSlots]);

  const endSlots = useMemo(() => {
    if (!startTime) return [];

    return getAvailableEndTimes(slots, startTime, bookingSlots);
  }, [slots, startTime, bookingSlots]);

  return (
    <>
      <View className="flex-row justify-center items-start gap-10 mt-2">
        {/* Start Time */}
        <View className="bg-background-sub2 rounded-lg p-2 w-[160px] relative">
          <Text className="color-foreground font-semibold text-lg">
            Bắt đầu
          </Text>

          <Pressable
            onPress={() => {
              setOpenStart(!openStart);
              setOpenEnd(false);
            }}
            className="rounded-lg bg-background py-1 px-2 flex-row gap-3 items-center justify-between my-1"
          >
            <Text className="color-foreground">
              {startTime || 'Chọn thời gian'}
            </Text>

            <Ionicons
              name="chevron-down-outline"
              size={16}
              color={colors.foreground}
            />
          </Pressable>

          {openStart && (
            <ScrollView
              className="absolute w-full max-h-[250px] rounded-md bg-background border border-foreground left-2 top-20 z-10"
              showsVerticalScrollIndicator={false}
            >
              {startSlots.map((slot, index) => (
                <Pressable
                  key={`${slot.start}-${slot.end}-${index}`}
                  onPress={() => handleSelectStart(slot.start)}
                  className={`p-2 ${
                    index !== 0 ? 'border-t border-background-sub1' : ''
                  }`}
                >
                  <Text className="color-foreground font-medium">
                    {slot.start}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* End Time */}
        <View className="bg-background-sub2 rounded-lg p-2 w-[160px] relative">
          <Text className="color-foreground font-semibold text-lg">
            Kết thúc
          </Text>

          <Pressable
            onPress={() => {
              setOpenEnd(!openEnd);
              setOpenStart(false);
            }}
            className={`rounded-lg py-1 px-2 flex-row gap-3 items-center justify-between my-1 ${!startTime ? 'bg-inactive-lighter' : 'bg-background'}`}
            disabled={!startTime}
          >
            <Text
              className={`${!startTime ? 'text-inactive-darker' : 'color-foreground'}`}
            >
              {endTime || 'Chọn thời gian'}
            </Text>

            <Ionicons
              name="chevron-down-outline"
              size={16}
              color={!startTime ? colors.inactive.darker : colors.foreground}
            />
          </Pressable>

          {openEnd && (
            <ScrollView
              className="absolute w-full max-h-[250px] rounded-md bg-background border border-foreground left-2 top-20 z-10"
              showsVerticalScrollIndicator={false}
            >
              {endSlots.map((slot, index) => (
                <Pressable
                  key={`${slot}-${index}`}
                  onPress={() => handleSelectEnd(slot)}
                  className={`p-2 ${
                    index !== 0 ? 'border-t border-background-sub1' : ''
                  } `}
                >
                  <Text className="color-foreground font-medium">{slot}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Button */}
      <View className="flex self-end mr-4 pr-4 mt-5">
        <Button
          text="Xác nhận"
          onPress={onPressConfirmSlot}
          colorType={!isValid ? 'grey' : 'sub1'}
          rounded="lg"
          width={100}
          disabled={!isValid}
        />
      </View>
    </>
  );
};

export default ChooseTime;
