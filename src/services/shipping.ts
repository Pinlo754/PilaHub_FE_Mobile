import api from '../hooks/axiosInstance';

export type GhnCalcRequest = {
  serviceTypeId: number; // 2=Standard, 5=Express
  vendorId: string; // vendor UUID
  addressId: string; // recipient address UUID
  height: number; // cm
  length: number; // cm
  width: number; // cm
  weight: number; // grams
  quantity: number;
};

export type GhnCalcResponse = {
  total: number; // VND
  serviceFee: number;
  insuranceFee?: number;
  pickStationFee?: number;
  couponValue?: number;
  r2sFee?: number;
};

export async function calculateShippingFee(payload: GhnCalcRequest): Promise<GhnCalcResponse> {
  const res = await api.post('/ghn/calculate-fee', payload);
  return res.data.data;
}
