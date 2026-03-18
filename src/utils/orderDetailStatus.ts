export function mapOrderDetailStatus(status?: string) {
  switch (String(status)) {
    case 'PENDING': return 'Chờ xử lý';
    case 'CONFIRMED': return 'Đã xác nhận';
    case 'PROCESSING': return 'Đang chuẩn bị';
    case 'DELIVERING': return 'Đang giao';
    case 'DELIVERED': return 'Đã giao';
    case 'COMPLETED': return 'Hoàn tất';
    case 'CANCELLED': return 'Đã huỷ';
    case 'RETURNED': return 'Đã trả hàng';
    case 'REFUNDED': return 'Đã hoàn tiền';
    case 'OUT_OF_STOCK': return 'Hết hàng';
    default: return String(status ?? 'N/A');
  }
}
