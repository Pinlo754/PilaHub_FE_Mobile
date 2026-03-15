// TYPE
export type TimeParts = {
  hours: number;
  minutes: number;
  seconds: number;
};

export type FormatTimeOptions = {
  showSeconds?: boolean;
  pad?: boolean;
};

type FormatInput = number | TimeParts;

export type SessionType = 'morning' | 'afternoon' | 'evening';

// CALC
export const calculateTimeParts = (totalSeconds: number): TimeParts => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return { hours, minutes, seconds };
};

export const hoursToTimeParts = (hours: number): TimeParts => {
  const totalSeconds = Math.round(hours * 3600);
  return calculateTimeParts(totalSeconds);
};

// FORMAT
export const formatTime = (
  input: FormatInput,
  options: FormatTimeOptions = {},
): string => {
  const { showSeconds = true, pad } = options;

  const parts = typeof input === 'number' ? calculateTimeParts(input) : input;

  const { hours, minutes, seconds } = parts;

  // Video style: hh:mm:ss or mm:ss
  if (pad) {
    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');

    if (hours > 0) {
      return showSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
    }

    return showSeconds ? `${mm}:${ss}` : mm;
  }

  // Text style: 1h 2p 3s
  if (hours > 0) {
  return showSeconds
    ? seconds > 0
      ? `${hours}h ${minutes}p ${seconds}s`
      : minutes > 0
        ? `${hours}h ${minutes}p`
        : `${hours}h`
    : minutes > 0
      ? `${hours}h ${minutes}p`
      : `${hours}h`;
}


  if (minutes > 0) {
    return showSeconds ? `${minutes}p ${seconds}s` : `${minutes}p`;
  }

  return showSeconds ? `${seconds}s` : `0p`;
};

export const formatHours = (hours: number) => {
  return formatTime(hoursToTimeParts(hours), { showSeconds: false });
};

// CONVERT
export const secondsToTime = (
  totalSeconds: number,
  options?: FormatTimeOptions,
): string => {
  const parts = calculateTimeParts(totalSeconds);
  return formatTime(parts, options);
};

export const timeToMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
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
