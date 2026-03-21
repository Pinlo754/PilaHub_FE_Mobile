import axios from '../hooks/axiosInstance';

export type OrderItem = { productId: string; quantity: number; discountAmount?: number; installationRequest?: boolean };

export type CreateOrderPayload = {
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  discountAmount?: number;
  shippingFee?: number;
  paymentMethod?: string;
  notes?: string;
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
  const res = await axios.post(`/orders/${orderId}/cancel`, { cancellationReason: reason });
  return res.data.data;
}

export async function confirmOrderDetail(orderDetailId: string) {
  // Backend currently exposes order-level status changes. Keep this function for compatibility
  // but it will throw 404 if per-order-detail endpoint is not available.
  const res = await axios.put(`/order-details/${orderDetailId}/confirm`);
  return res.data.data;
}

export async function requestOrderDetailReturn(orderDetailId: string, reason: string) {
  // Deprecated: prefer order-level return via requestOrderReturn(orderId, reason)
  const res = await axios.post(`/order-details/${orderDetailId}/return`, { reason });
  return res.data.data;
}

export async function requestOrderReturn(orderId: string, reason: string) {
  const res = await axios.post(`/orders/${orderId}/return`, { reason });
  return res.data.data;
}

// Deprecated: if backend removes order-detail endpoints entirely we'll keep these wrappers
// so FE code calling them can be updated later.
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
