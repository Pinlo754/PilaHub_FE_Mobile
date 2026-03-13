import { BookingStatus } from '../utils/CoachBookingType';

export enum BookingTab {
  Scheduled = 1,
  Ready = 2,
  History = 3,
}

type ConfigItem = {
  disablePressCard: boolean;
  showButton: boolean;
  buttonText?: string;
  buttonWidth?: number;
};

export const BOOKING_UI_CONFIG: Record<BookingStatus, ConfigItem> = {
  SCHEDULED: {
    disablePressCard: false,
    showButton: false,
  },

  READY: {
    disablePressCard: true,
    showButton: true,
    buttonText: 'Vào',
    buttonWidth: 90,
  },

  IN_PROGRESS: {
    disablePressCard: true,
    showButton: true,
    buttonText: 'Vào',
    buttonWidth: 90,
  },

  COMPLETED: {
    disablePressCard: true,
    showButton: true,
    buttonText: 'Xem đánh giá',
    buttonWidth: 150,
  },

  CANCELLED_BY_COACH: {
    disablePressCard: false,
    showButton: false,
  },

  CANCELLED_BY_TRAINEE: {
    disablePressCard: false,
    showButton: false,
  },

  NO_SHOW_BY_COACH: {
    disablePressCard: false,
    showButton: false,
  },

  NO_SHOW_BY_TRAINEE: {
    disablePressCard: false,
    showButton: false,
  },

  REFUNDED: {
    disablePressCard: false,
    showButton: false,
  },
};
