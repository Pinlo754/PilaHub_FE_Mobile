export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errorCode: string | null;
  timestamp: number;
};
