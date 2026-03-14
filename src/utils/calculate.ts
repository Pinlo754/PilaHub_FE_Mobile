import { BookingSlot } from './CoachBookingType';
import { timeToMinutes } from './time';

// số giờ của slot
export const getSlotHours = (slot: BookingSlot): number => {
  const start = timeToMinutes(slot.startTime);
  const end = timeToMinutes(slot.endTime);

  return (end - start) / 60;
};

// tiền của 1 slot
export const getSlotPrice = (
  slot: BookingSlot,
  pricePerHour: number,
): number => {
  const hours = getSlotHours(slot);

  return hours * pricePerHour;
};

// tổng tiền của tất cả slots
export const getTotalBookingPrice = (
  slots: BookingSlot[],
  pricePerHour: number,
): number => {
  return slots.reduce((total, slot) => {
    return total + getSlotPrice(slot, pricePerHour);
  }, 0);
};

// tổng số giờ của tất cả slots
export const getTotalBookingHours = (slots: BookingSlot[]): number => {
  return slots.reduce((total, slot) => {
    return total + getSlotHours(slot);
  }, 0);
};

// tổng tiền + tổng số giờ
export const calculateBookingSummary = (
  slots: BookingSlot[],
  pricePerHour: number,
) => {
  let totalHours = 0;

  for (const slot of slots) {
    totalHours += getSlotHours(slot);
  }

  return {
    totalHours,
    totalPrice: totalHours * pricePerHour,
  };
};
