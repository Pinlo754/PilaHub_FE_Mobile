import axios from '../hooks/axiosInstance';

export type OrderItem = {
  productId: string;
  quantity: number;
  discountAmount?: number;
  installationRequest?: boolean;
};

export type VendorShipping = {
  vendorId: string;
  shippingFee: number;
};

export type CreateOrderPayload = {
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  addressId: string;
  items: OrderItem[];
  discountAmount?: number;
  vendorShippings: VendorShipping[];
  paymentMethod: 'WALLET' | 'VNPAY' | 'COD' | 'CARD' | string;
  notes?: string;
};

export type OrderReturnItem = {
  orderDetailId: string;
  quantity: number;
};

export type CreateOrderReturnPayload = {
  reason: string;
  items: OrderReturnItem[];
};

export async function createOrder(payload: CreateOrderPayload) {
  const res = await axios.post('/orders', payload);
  return res.data.data;
}

export async function getMyOrders() {
  const res = await axios.get('/orders/my-orders');
  return res.data.data;
}

export async function cancelOrder(orderId: string, reason: string) {
  const res = await axios.post(`/orders/${orderId}/cancel`, {
    cancellationReason: reason,
  });
  return res.data.data;
}

export async function confirmOrderDetail(orderDetailId: string) {
  const res = await axios.put(`/order-details/${orderDetailId}/confirm`);
  return res.data.data;
}

export async function requestOrderDetailReturn(orderDetailId: string, reason: string) {
  const res = await axios.post(`/order-details/${orderDetailId}/return`, { reason });
  return res.data.data;
}

export async function requestOrderReturn(orderId: string, reason: string) {
  const res = await axios.post(`/orders/${orderId}/return`, { reason });
  return res.data.data;
}

/** Tạo yêu cầu trả hàng (chọn từng món) — POST /api/order-returns */
export async function createOrderReturn(payload: CreateOrderReturnPayload) {
  const res = await axios.post('/order-returns', payload);
  return res.data.data;
}

export async function getMyOrderReturns() {
  const res = await axios.get('/order-returns/my-returns');
  return res.data.data;
}

export async function getOrderReturnById(returnId: string) {
  const res = await axios.get(`/order-returns/${returnId}`);
  return res.data.data;
}

export async function getOrderById(orderId: string) {
  const res = await axios.get(`/orders/${orderId}`);
  return res.data.data;
}

export async function getMyOrdersByStatus(status: string) {
  const res = await axios.get(`/orders/my-orders/status/${status}`);
  return res.data.data;
}

export async function getOrderTracking(orderNumber: string) {
  const res = await axios.get(`/orders/tracking/${orderNumber}`);
  return res.data.data;
}