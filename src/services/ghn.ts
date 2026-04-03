import api from '../hooks/axiosInstance';

export async function getProvinces() {
  const res = await api.get('/ghn/provinces');
  const data = res.data?.data ?? [];
  // normalize keys to camelCase expected by UI
  return (Array.isArray(data) ? data : []).map((p: any) => ({
    provinceId: p.ProvinceID ?? p.provinceId,
    provinceName: p.ProvinceName ?? p.provinceName,
    code: p.Code ?? p.code,
    raw: p
  }));
}

export async function getDistricts(provinceId: number) {
  const res = await api.get(`/ghn/districts/${provinceId}`);
  const data = res.data?.data ?? [];
  return (Array.isArray(data) ? data : []).map((d: any) => ({
    districtId: d.DistrictID ?? d.districtId,
    districtName: d.DistrictName ?? d.districtName,
    provinceId: d.ProvinceID ?? d.provinceId,
    raw: d
  }));
}

export async function getWards(districtId: number) {
  const res = await api.get(`/ghn/wards/${districtId}`);
  const data = res.data?.data ?? [];
  return (Array.isArray(data) ? data : []).map((w: any) => ({
    wardCode: w.WardCode ?? w.wardCode,
    wardName: w.WardName ?? w.wardName,
    districtId: w.DistrictID ?? w.districtId,
    raw: w
  }));
}
