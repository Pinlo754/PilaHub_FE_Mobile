type ErrorType = {
  type?: string;
  message?: string;
  errorCode?: string;
};

// Map theo errorCode (ưu tiên)
const ERROR_CODE_MAP: Record<string, string> = {
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
  EXERCISE_NOT_FOUND: 'Không tìm thấy bài tập',
  INVALID_REQUEST: 'Yêu cầu không hợp lệ',
  UNAUTHORIZED: 'Bạn chưa đăng nhập',
  FORBIDDEN: 'Bạn không có quyền truy cập',
  INTERNAL_SERVER_ERROR: 'Lỗi hệ thống, vui lòng thử lại sau',
};

// Fallback map theo message (nếu BE chưa có errorCode)
const ERROR_MESSAGE_MAP: Record<string, string> = {
  'User not found': 'Không tìm thấy người dùng',
  'Exercise not found': 'Không tìm thấy bài tập',
  'Invalid request': 'Yêu cầu không hợp lệ',
};

export const mapErrorMessage = (error: ErrorType): string => {
  // Ưu tiên errorCode
  if (error?.errorCode && ERROR_CODE_MAP[error.errorCode]) {
    return ERROR_CODE_MAP[error.errorCode];
  }

  // fallback message
  if (error?.message && ERROR_MESSAGE_MAP[error.message]) {
    return ERROR_MESSAGE_MAP[error.message];
  }

  // fallback cuối
  return error?.message || 'Đã có lỗi xảy ra, vui lòng thử lại';
};
