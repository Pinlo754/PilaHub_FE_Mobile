export const formatVND = (value: number): string => {
  if (isNaN(value)) return '0đ';

  return value.toLocaleString('vi-VN') + 'đ';
};
