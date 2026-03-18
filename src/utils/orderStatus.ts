export function mapOrderStatusLabel(status?: string) {
  switch (String(status)) {
    case 'PENDING': return 'Chờ xác nhận';
    case 'CONFIRMED': return 'Đã xác nhận';
    case 'PROCESSING': return 'Đang xử lý';
    case 'DELIVERING': return 'Đang giao';
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
    case 'PROCESSING': return { backgroundColor: '#FFEFD5', color: '#B76E00' };
    case 'DELIVERING': return { backgroundColor: '#E6F6FF', color: '#055160' };
    case 'DELIVERED': return { backgroundColor: '#E6F9F0', color: '#0B8A54' };
    case 'FAILED_DELIVERY': return { backgroundColor: '#FFF1F2', color: '#C53030' };
    case 'COMPLETED': return { backgroundColor: '#E6F9F0', color: '#065F46' };
    case 'CANCELLED': return { backgroundColor: '#F2F2F4', color: '#7A7A80' };
    case 'RETURNED': return { backgroundColor: '#FFF7ED', color: '#B76E00' };
    case 'REFUNDED': return { backgroundColor: '#F0FFF4', color: '#137547' };
    default: return { backgroundColor: '#F3F4F6', color: '#111827' };
  }
}
