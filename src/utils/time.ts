// TYPE
export type TimeParts = {
  hours: number;
  minutes: number;
  seconds: number;
};

export type FormatTimeOptions = {
  showSeconds?: boolean;
};

export type SessionType = 'morning' | 'afternoon' | 'evening';

export const calculateTimeParts = (totalSeconds: number): TimeParts => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return { hours, minutes, seconds };
};

// FORMAT
export const formatTime = (
  { hours, minutes, seconds }: TimeParts,
  options: FormatTimeOptions = {},
): string => {
  const { showSeconds = true } = options;

  if (hours > 0) {
    return showSeconds
      ? `${hours}h ${minutes}p ${seconds}s`
      : `${hours}h ${minutes}p`;
  }

  if (minutes > 0) {
    return showSeconds ? `${minutes}p ${seconds}s` : `${minutes}p`;
  }

  return showSeconds ? `${seconds}s` : `0p`;
};

// CONVERT
export const secondsToTime = (
  totalSeconds: number,
  options?: FormatTimeOptions,
): string => {
  const parts = calculateTimeParts(totalSeconds);
  return formatTime(parts, options);
};

// GET
export const getSessionByHour = (hour: number): SessionType => {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

export const getSessionColor = (session: SessionType) => {
  switch (session) {
    case 'morning':
      return 'bg-warning';
    case 'afternoon':
      return 'bg-info-darker';
    case 'evening':
      return 'bg-purple';
    default:
      return 'bg-warning';
  }
};
