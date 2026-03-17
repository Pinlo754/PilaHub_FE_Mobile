export type ShipmentStatusKey =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'CANCELLED'
  | 'RETURNED'
  | 'REFUNDED'
  | string;

export const shipmentStatusMap: Record<ShipmentStatusKey, { label: string; bgColor: string; textColor: string }> = {
  PENDING: { label: 'Chờ xử lý', bgColor: '#EEF2FF', textColor: '#334ECA' },
  CONFIRMED: { label: 'Đã xác nhận', bgColor: '#FFF7ED', textColor: '#B76E00' },
  PROCESSING: { label: 'Đang chuẩn bị', bgColor: '#FFF7ED', textColor: '#B76E00' },
  SHIPPED: { label: 'Đã gửi', bgColor: '#E6F6FF', textColor: '#055160' },
  DELIVERED: { label: 'Đã giao', bgColor: '#E6F9F0', textColor: '#0B8A54' },
  FAILED_DELIVERY: { label: 'Giao thất bại', bgColor: '#FFF1F2', textColor: '#C53030' },
  CANCELLED: { label: 'Đã huỷ', bgColor: '#F2F2F4', textColor: '#7A7A80' },
  RETURNED: { label: 'Đã trả hàng', bgColor: '#FFF7ED', textColor: '#B76E00' },
  REFUNDED: { label: 'Đã hoàn tiền', bgColor: '#F0FFF4', textColor: '#137547' },
};

export function mapShipmentStatus(status?: string) {
  if (!status) return { label: 'N/A', bgColor: '#F2F2F4', textColor: '#7A7A80' };
  return shipmentStatusMap[status as ShipmentStatusKey] ?? { label: String(status), bgColor: '#F2F2F4', textColor: '#333' };
}
