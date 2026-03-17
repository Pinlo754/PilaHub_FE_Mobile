import api from '../hooks/axiosInstance';

export async function getProvinces() {
  const res = await api.get('/ghn/provinces');
  return res.data.data;
}

export async function getDistricts(provinceId: number) {
  const res = await api.get(`/ghn/districts/${provinceId}`);
  return res.data.data;
}

export async function getWards(districtId: number) {
  const res = await api.get(`/ghn/wards/${districtId}`);
  return res.data.data;
}
