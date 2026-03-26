export const ORDER_STATUS_LIST = [
  'PENDING',
  'CONFIRMED',
  'READY',
  'SHIPPED',
  'DELIVERED',
  'FAILED_DELIVERY',
  'COMPLETED',
  'CANCELLED',
  'RETURNED',
  'REFUNDED'
] as const;

export type OrderStatus = typeof ORDER_STATUS_LIST[number];

export function mapOrderStatusLabel(status?: string) {
  switch (String(status)) {
    case 'PENDING': return 'Chờ xác nhận';
    case 'CONFIRMED': return 'Đã xác nhận';
    case 'READY': return 'Sẵn sàng';
    case 'SHIPPED': return 'Đã gửi';
    case 'DELIVERED': return 'Đã giao';
    case 'FAILED_DELIVERY': return 'Giao thất bại';
    case 'COMPLETED': return 'Hoàn tất';
    case 'CANCELLED': return 'Đã huỷ';
    case 'RETURNED': return 'Đã trả hàng';
    case 'REFUNDED': return 'Đã hoàn tiền';
    default: return String(status ?? 'N/A');
  }
}

export function statusColor(status?: string) {
  switch (String(status)) {
    case 'PENDING': return { backgroundColor: '#FFF7ED', color: '#D97706' };
    case 'CONFIRMED': return { backgroundColor: '#EEF2FF', color: '#334ECA' };
    case 'READY': return { backgroundColor: '#E6F6FF', color: '#0B84B8' };
    case 'SHIPPED': return { backgroundColor: '#E6F6FF', color: '#055160' };
    case 'DELIVERED': return { backgroundColor: '#E6F9F0', color: '#0B8A54' };
    case 'FAILED_DELIVERY': return { backgroundColor: '#FFF1F2', color: '#C53030' };
    case 'COMPLETED': return { backgroundColor: '#E6F9F0', color: '#065F46' };
    case 'CANCELLED': return { backgroundColor: '#F2F2F4', color: '#7A7A80' };
    case 'RETURNED': return { backgroundColor: '#FFF7ED', color: '#B76E00' };
    case 'REFUNDED': return { backgroundColor: '#F0FFF4', color: '#137547' };
    default: return { backgroundColor: '#F3F4F6', color: '#111827' };
  }
}

// Filters used by Orders UI. First item is 'ALL' to show every status; followed by each concrete status.
export const ORDER_STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  ...ORDER_STATUS_LIST.map((s) => ({ key: String(s), label: mapOrderStatusLabel(String(s)) }))
];

// Utility to get human labels for rendering tabs or selects
export const getAllStatusLabels = () => ORDER_STATUS_LIST.map((s) => ({ key: String(s), label: mapOrderStatusLabel(String(s)) }));

// Map status -> Ionicons name (used by OrdersScreen tabs)
export function statusIcon(status?: string) {
  switch (String(status)) {
    case 'PENDING': return 'time-outline';
    case 'CONFIRMED': return 'checkmark-done-outline';
    case 'READY': return 'cube-outline';
    case 'SHIPPED': return 'paper-plane-outline';
    case 'DELIVERED': return 'archive-outline';
    case 'FAILED_DELIVERY': return 'alert-circle-outline';
    case 'COMPLETED': return 'trophy-outline';
    case 'CANCELLED': return 'close-circle-outline';
    case 'RETURNED': return 'repeat-outline';
    case 'REFUNDED': return 'wallet-outline';
    case 'ALL': return 'apps-outline';
    default: return 'ellipse-outline';
  }
}

// Map status -> small emoji fallback for tabs
// export function statusEmoji(status?: string) {
//   switch (String(status)) {
//     case 'PENDING': return '⏳';
//     case 'CONFIRMED': return '✅';
//     case 'READY': return '📦';
//     case 'SHIPPED': return '✈️';
//     case 'DELIVERED': return '📬';
//     case 'FAILED_DELIVERY': return '⚠️';
//     case 'COMPLETED': return '🏆';
//     case 'CANCELLED': return '❌';
//     case 'RETURNED': return '🔁';
//     case 'REFUNDED': return '💸';
//     case 'ALL': return '📚';
//     default: return 'ℹ️';
//   }
// }
