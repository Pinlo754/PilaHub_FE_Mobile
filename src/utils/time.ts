export type TimeParts = {
  hours: number;
  minutes: number;
  seconds: number;
};

export type FormatTimeOptions = {
  showSeconds?: boolean;
};

export const calculateTimeParts = (totalSeconds: number): TimeParts => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return { hours, minutes, seconds };
};

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

export const secondsToTime = (
  totalSeconds: number,
  options?: FormatTimeOptions,
): string => {
  const parts = calculateTimeParts(totalSeconds);
  return formatTime(parts, options);
};
