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
  showReportButton: boolean;
};

export const BOOKING_UI_CONFIG: Record<BookingStatus, ConfigItem> = {
  SCHEDULED: {
    disablePressCard: false,
    showButton: false,
    showReportButton: false,
  },

  READY: {
    disablePressCard: true,
    showButton: true,
    buttonText: 'Vào',
    buttonWidth: 90,
    showReportButton: false,
  },

  IN_PROGRESS: {
    disablePressCard: true,
    showButton: true,
    buttonText: 'Vào',
    buttonWidth: 90,
    showReportButton: false,
  },

  COMPLETED: {
    disablePressCard: false,
    showButton: true,
    buttonText: 'Xem đánh giá',
    buttonWidth: 150,
    showReportButton: true,
  },

  CANCELLED_BY_COACH: {
    disablePressCard: false,
    showButton: false,
    showReportButton: true,
  },

  CANCELLED_BY_TRAINEE: {
    disablePressCard: false,
    showButton: false,
    showReportButton: false,
  },

  NO_SHOW_BY_COACH: {
    disablePressCard: false,
    showButton: false,
    showReportButton: true,
  },

  NO_SHOW_BY_TRAINEE: {
    disablePressCard: false,
    showButton: false,
    showReportButton: false,
  },

  REFUNDED: {
    disablePressCard: false,
    showButton: false,
    showReportButton: false,
  },
};
