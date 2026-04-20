import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { calculateTimeParts, formatTime } from './time';

dayjs.extend(utc);

export const WEEK_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// TYPE
export type DayItem = {
  month: string;
  date: string;
  dayLabel: string;
  fullDate: Date;
};

export type WeekTimeRange = {
  startTime: string;
  endTime: string;
};

type DurationDisplay = {
  date: string;
  startTime: string;
  endTime: string;
};

type ISOFormatType = 'date' | 'time' | 'datetime';

type FormatISOOptions = {
  type?: ISOFormatType;
  showSeconds?: boolean;
};

// FUNCTIONS
export const getWeekDays = (date: Date): DayItem[] => {
  const start = new Date(date);

  const day = date.getDay();

  // nếu CN thì lùi 6 ngày, còn lại lùi (day - 1)
  const diff = day === 0 ? -6 : 1 - day;

  start.setDate(date.getDate() + diff);

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    return {
      month: `${d.getMonth() + 1}`,
      date: d.getDate().toString(),
      dayLabel: WEEK_LABELS[i],
      fullDate: d,
    };
  });
};

export const getNextWeekDate = (date: Date, step: number) => {
  const d = new Date(date);
  d.setDate(date.getDate() + step * 7);
  return d;
};

export const getWeekStart = (date: dayjs.Dayjs) => {
  const day = date.day();

  const diff = day === 0 ? -6 : 1 - day;

  return date.add(diff, 'day').startOf('day');
};

export const getWeekTimeRange = (date: Date) => {
  const d = dayjs(date);

  const monday = d.subtract((d.day() + 6) % 7, 'day').startOf('day');
  const sunday = monday.add(6, 'day').endOf('day');

  return {
    startTime: monday.utc().toISOString(),
    endTime: sunday.utc().toISOString(),
  };
};

// FORMAT
export const formatWeekRange = (days: DayItem[]) => {
  if (!days.length) return '';

  const start = days[0].fullDate;
  const end = days[days.length - 1].fullDate;

  const format = (d: Date) =>
    `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

  return `${format(start)} - ${format(end)}`;
};

export const formatSelectedLabel = (date?: Date | null) => {
  if (!date) return 'Chọn ngày';

  return `${WEEK_LABELS[date.getDay()]}, ${date.getDate()}/${
    date.getMonth() + 1
  }`;
};

export const buildISOTime = (date: Date, time: string) => {
  const [hour, minute] = time.split(':').map(Number);

  return dayjs(date)
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0)
    .utc()
    .toISOString();
};

export const formatDurationDateTime = (
  startTime: string,
  endTime: string,
): DurationDisplay => {
  const start = dayjs.utc(startTime).local();
  const end = dayjs.utc(endTime).local();

  const formatTimeText = (d: dayjs.Dayjs) => {
    const totalSeconds = d.hour() * 3600 + d.minute() * 60 + d.second();
    const parts = calculateTimeParts(totalSeconds);

    return formatTime(parts, { showSeconds: false });
  };

  return {
    date: start.format('DD/MM/YYYY'),
    startTime: formatTimeText(start),
    endTime: formatTimeText(end),
  };
};

export const formatDateTime = (
  isoString: string,
  options: FormatISOOptions = {},
): string => {
  const { type = 'datetime', showSeconds = false } = options;

  const d = dayjs.utc(isoString).local();

  if (!d.isValid()) return '';

  // TIME (reuse logic của bạn)
  if (type === 'time') {
    const totalSeconds = d.hour() * 3600 + d.minute() * 60 + d.second();

    const parts = calculateTimeParts(totalSeconds);

    return formatTime(parts, { showSeconds, pad: true });
  }

  // DATE
  if (type === 'date') {
    return d.format('DD/MM/YYYY');
  }

  // DATETIME
  const date = d.format('DD/MM/YYYY');

  const totalSeconds = d.hour() * 3600 + d.minute() * 60 + d.second();

  const parts = calculateTimeParts(totalSeconds);

  const time = formatTime(parts, { showSeconds, pad: true });

  return `${time} ${date}`;
};

// CHECK
export const checkIsToday = (a: Date, b: Date) =>
  dayjs(a).isSame(dayjs(b), 'day');
