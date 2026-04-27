export const formatVND = (value: number): string => {
  if (isNaN(value)) return '0đ';

  return value.toLocaleString('vi-VN') + 'đ';
};

export const formatShortVND = (value: number): string => {
  if (isNaN(value)) return '0đ';

  const abs = Math.abs(value);

  const billion = Math.floor(abs / 1_000_000_000);
  const million = Math.floor((abs % 1_000_000_000) / 1_000_000);
  const thousand = Math.floor((abs % 1_000_000) / 1_000);

  let result = '';

  if (billion > 0) {
    result += `${billion}t`;
    if (million > 0) result += `${million.toString().padStart(3, '0')}tr`;
    if (thousand > 0) result += `${thousand.toString().padStart(3, '0')}`;
  } else if (million > 0) {
    result += `${million}tr`;
    if (thousand > 0) result += `${thousand.toString().padStart(3, '0')}`;
  } else if (thousand > 0) {
    result += `${thousand}k`;
  } else {
    result = abs.toString();
  }

  return (value < 0 ? '-' : '') + result;
};
