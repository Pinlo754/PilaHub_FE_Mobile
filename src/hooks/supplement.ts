import api from '../hooks/axiosInstance';

export type SupplementDetail = {
  supplementId: string;
  name?: string;
  description?: string;
  brand?: string;
  form?: string;
  usageInstructions?: string;
  benefits?: string;
  sideEffects?: string;
  contraindications?: string;
  warnings?: string;
  imageUrl?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function getSupplementById(id: string): Promise<SupplementDetail | null> {
  if (!id) return null;

  const res = await api.get(`/supplements/${id}`);

  return res.data?.data ?? null;
}