import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { CoachTimeOffType } from '../utils/CoachTimeOffType';
import { getWeekStart } from './day';
import { timeToMinutes } from './time';
import { BookingSlot, BusyTimeSlotRes } from './CoachBookingType';

dayjs.extend(utc);

type Range = {
  startTime: string;
  endTime: string;
};

type HourSlot = {
  start: string;
  end: string;
};

export type DaySchedule = {
  date: string;
  slots: HourSlot[];
};

/**
 * Check slot có bị timeOff không
 */
export const isSlotBusy = (start: string, end: string, ranges: Range[]) => {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  return ranges.some(r => {
    const rStart = timeToMinutes(r.startTime);
    const rEnd = timeToMinutes(r.endTime);

    return isOverlap(startMin, endMin, rStart, rEnd);
  });
};

export const isOverlap = (
  startA: number,
  endA: number,
  startB: number,
  endB: number,
) => {
  return startA < endB && endA > startB;
};

const getTodayStartHour = () => {
  const now = dayjs();
  const plusOneHour = now.add(1, 'hour');

  // nếu có phút thì làm tròn lên giờ tiếp theo
  return plusOneHour.minute() > 0 ? plusOneHour.hour() + 1 : plusOneHour.hour();
};

/**
 * Generate slot cho 1 ngày (UTC)
 */
const generateDaySlots = (
  date: dayjs.Dayjs,
  timeOffs: CoachTimeOffType[],
): HourSlot[] => {
  const slots: HourSlot[] = [];

  const isToday = date.isSame(dayjs(), 'day');

  const startHour = isToday ? Math.max(6, getTodayStartHour()) : 6;

  // convert timeOff -> Range
  const ranges: Range[] = timeOffs.map(off => ({
    startTime: dayjs(off.startTime).format('HH:mm'),
    endTime: dayjs(off.endTime).format('HH:mm'),
  }));

  for (let hour = startHour; hour < 20; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const end = `${(hour + 1).toString().padStart(2, '0')}:00`;

    if (!isSlotBusy(start, end, ranges)) {
      slots.push({
        start,
        end,
      });
    }
  }

  return slots;
};

export const getAvailableStartSlots = (
  slots: HourSlot[],
  bookingSlots: BookingSlot[],
) => {
  // convert bookingSlots -> Range
  const busyRanges: Range[] = bookingSlots.map(slot => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));

  return slots.filter(slot => {
    return !isSlotBusy(slot.start, slot.end, busyRanges);
  });
};

export const getAvailableEndTimes = (
  slots: HourSlot[],
  startTime: string,
  bookingSlots: BookingSlot[],
): string[] => {
  // convert bookingSlots -> Range
  const busyRanges: Range[] = bookingSlots.map(slot => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));

  const startIndex = slots.findIndex(s => s.start === startTime);

  if (startIndex === -1) return [];

  const results: string[] = [];

  let expectedNextStart = slots[startIndex].end;

  for (let i = startIndex; i < slots.length; i++) {
    const slot = slots[i];

    // stop nếu slot không liên tiếp
    if (slot.start !== expectedNextStart && i !== startIndex) break;

    // stop nếu trùng bookingSlots
    if (isSlotBusy(slot.start, slot.end, busyRanges)) break;

    results.push(slot.end);
    expectedNextStart = slot.end;
  }

  return results;
};

/**
 * Generate schedule nhiều ngày (UTC)
 */
export const generateCoachSchedule = (
  timeOffs: CoachTimeOffType[],
  startDate: Date,
  days: number = 7,
): DaySchedule[] => {
  const result: DaySchedule[] = [];

  const weekStart = getWeekStart(dayjs(startDate));

  for (let i = 0; i < days; i++) {
    const date = weekStart.add(i, 'day');

    const dayTimeOffs = timeOffs.filter(off => {
      const start = dayjs(off.startTime).local();
      const end = dayjs(off.endTime).local();

      return (
        start.isBefore(date.endOf('day')) && end.isAfter(date.startOf('day'))
      );
    });

    const slots = generateDaySlots(date, dayTimeOffs);

    result.push({
      date: date.format('YYYY-MM-DD'),
      slots,
    });
  }

  return result;
};

/**
 * Generate schedule từ BusyTimeSlotRes[]
 */
export const generateCoachScheduleFromBusy = (
  busySlots: BusyTimeSlotRes[],
  startDate: Date,
  days: number = 7,
): DaySchedule[] => {
  const result: DaySchedule[] = [];

  const weekStart = getWeekStart(dayjs(startDate));

  for (let i = 0; i < days; i++) {
    const date = weekStart.add(i, 'day');

    // Lọc busy slot thuộc ngày này
    const dayBusy = busySlots.filter(slot => {
      const start = dayjs(slot.startTime).local();
      const end = dayjs(slot.endTime).local();

      return (
        start.isBefore(date.endOf('day')) && end.isAfter(date.startOf('day'))
      );
    });

    // Convert sang Range (local time HH:mm)
    const ranges: Range[] = dayBusy.map(slot => ({
      startTime: dayjs(slot.startTime).local().format('HH:mm'),
      endTime: dayjs(slot.endTime).local().format('HH:mm'),
    }));

    const slots = generateDaySlotsFromRanges(date, ranges);

    result.push({
      date: date.format('YYYY-MM-DD'),
      slots,
    });
  }

  return result;
};

/**
 * Generate slot cho 1 ngày từ busy ranges (dùng chung logic)
 */
const generateDaySlotsFromRanges = (
  date: dayjs.Dayjs,
  ranges: Range[],
): HourSlot[] => {
  const slots: HourSlot[] = [];

  const isToday = date.isSame(dayjs(), 'day');
  const startHour = isToday ? Math.max(6, getTodayStartHour()) : 6;

  for (let hour = startHour; hour < 20; hour++) {
    const start = `${hour.toString().padStart(2, '0')}:00`;
    const end = `${(hour + 1).toString().padStart(2, '0')}:00`;

    if (!isSlotBusy(start, end, ranges)) {
      slots.push({ start, end });
    }
  }

  return slots;
};
