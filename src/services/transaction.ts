import api from '../hooks/axiosInstance';

export async function getMyTransactions() {
  const res = await api.get('/transactions/my-transactions');
  return res.data?.data ?? [];
}

export async function getTransactionsByType(type: string) {
  const res = await api.get('/transactions/my-transactions/by-type', { params: { type } });
  return res.data?.data ?? [];
}

export async function getTransactionById(transactionId: string) {
  const res = await api.get(`/transactions/my-transactions/${transactionId}`);
  return res.data?.data ?? null;
}
