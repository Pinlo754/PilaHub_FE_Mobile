// TYPE
export type DayItem = {
  month: string;
  date: string;
  dayLabel: string;
  fullDate: Date;
};

// FUNCTIONS
export const getWeekDays = (date: Date): DayItem[] => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // CN đầu tuần

  const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    return {
      month: `${d.getMonth() + 1}`,
      date: d.getDate().toString(),
      dayLabel: labels[d.getDay()],
      fullDate: d,
    };
  });
};

export const getNextWeekDate = (date: Date, step: number) => {
  const d = new Date(date);
  d.setDate(date.getDate() + step * 7);
  return d;
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
  const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${labels[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}`;
};

// CHECK
export const checkIsToday = (a: Date, b: Date) =>
  a.getDate() === b.getDate() &&
  a.getMonth() === b.getMonth() &&
  a.getFullYear() === b.getFullYear();
