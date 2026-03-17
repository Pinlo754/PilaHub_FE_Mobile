import axios from '../hooks/axiosInstance';

export type AddressPayload = {
  receiverName: string;
  receiverPhone: string;
  addressLine: string;
  province?: string;
  city?: string;
  district?: string;
  ward?: string;
  isDefault?: boolean;
};

export type AddressDto = AddressPayload & {
  addressId: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAddresses(): Promise<AddressDto[]> {
  const res = await axios.get('/addresses');
  return res.data.data;
}

export async function createAddress(payload: AddressPayload): Promise<AddressDto> {
  const res = await axios.post('/addresses', payload);
  return res.data.data;
}

export async function updateAddress(addressId: string, payload: Partial<AddressPayload>): Promise<AddressDto> {
  const res = await axios.put(`/addresses/${addressId}`, payload);
  return res.data.data;
}

export async function deleteAddress(addressId: string): Promise<void> {
  await axios.delete(`/addresses/${addressId}`);
}
