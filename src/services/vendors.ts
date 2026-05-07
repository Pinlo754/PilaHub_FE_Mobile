import api from '../hooks/axiosInstance';
import { normalizeImageUrl } from './products';

export type VendorItem = {
  vendorId: string;
  businessName?: string;
  name?: string;
  description?: string;
  logoUrl?: string;
  city?: string;
  address?: string;
  phoneNumber?: string;
  rating?: number;
  verified?: boolean;
  raw?: any;
};

export async function getVendorById(vendorId: string): Promise<VendorItem | null> {
  if (!vendorId) return null;
  try {
    const res = await api.get(`/vendors/${vendorId}`);
    const apiResp = res.data ?? {};
    const payload = apiResp.data ?? apiResp;
    const v = payload ?? null;
    if (!v) return null;
    return {
      vendorId: v.vendorId ?? v.vendor_id ?? (v.id ? String(v.id) : ''),
      businessName: v.businessName ?? v.business_name ?? v.vendorBusinessName ?? v.vendor_business_name,
      name: v.businessName ?? v.name ?? v.vendorBusinessName ?? v.vendor_business_name,
      description: v.description ?? v.about ?? undefined,
      logoUrl: normalizeImageUrl(v.logoUrl ?? v.logo_url ?? v.logo) ?? undefined,
      city: v.city ?? v.location ?? undefined,
      // map possible address fields returned by different APIs
      address:
        v.address ?? v.address_line ?? v.street_address ?? v.location_address ?? v.address_line1 ?? undefined,
      phoneNumber: v.phoneNumber ?? v.phone_number ?? v.phone ?? undefined,
      rating: typeof v.avgRating === 'number' ? v.avgRating : (v.avg_rating ? Number(v.avg_rating) : undefined),
      verified: Boolean(v.verified ?? false),
      raw: v,
    };
  } catch (e) {
    console.warn('getVendorById error', e);
    return null;
  }
}
