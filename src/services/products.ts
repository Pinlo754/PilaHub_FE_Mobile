import api from '../hooks/axiosInstance';

export type ProductItem = {
	productId: string;
	vendorId?: string;
	vendorBusinessName?: string;
	categoryId?: string;
	categoryName?: string;
	name: string;
	description?: string;
	imageUrl?: string;
	thumbnailUrl?: string; // normalized thumbnail (camelCase)
	thumnail_url?: string; // legacy/typo field used in some mappings
	price?: number;
	stockQuantity?: number;
	brand?: string;
	specifications?: string;
	height?: number;
	length?: number;
	width?: number;
	weight?: number;
	installationSupported?: boolean;
	regionSupported?: string[];
	avgRating?: number;
	reviewCount?: number;
	active?: boolean;
	createdAt?: string;
	updatedAt?: string;
	raw?: any;
};

export type CategoryItem = { id: string; name: string; icon?: string };

export async function getNewProducts(): Promise<ProductItem[]> {
  try {
    const res = await getProducts(0, 12);
    return res.items;
  } catch (e: any) {
    console.warn('getNewProducts error', e);
    return [];
  }
}

export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const res = await api.get('/categories/root/active');
    const apiResp = res.data ?? {};
    const payload = apiResp.data ?? apiResp;
    const list = Array.isArray(payload) ? payload : (payload?.content ?? payload?.items ?? []);

    return (list || []).map((c: any) => ({
      id: c.id ?? c.categoryId ?? String(c.categoryId ?? c.id ?? ''),
      name: c.name ?? c.categoryName ?? c.title ?? '',
      icon: c.imgUrl ?? c.imageUrl ?? undefined,
    }));
  } catch (e: any) {
    console.warn('getCategories error', e);
    return [];
  }
}

// Paged result helper used by FE
export type PagedResult<T> = { items: T[]; total: number; page: number; size: number };

/**
 * Fetch products with backend contract:
 * GET /products
 * Backend response shape: APIResponse<PageResponse<ProductDto>>
 */
export async function getProducts(
  page = 0,
  size = 20,
  name?: string,
  filters?: Partial<{
    vendorId: string;
    categoryId: string;
    brand: string;
    minPrice: number;
    maxPrice: number;
    minRating: number;
    active: boolean;
  }>,
  sortField?: string,
  sortDir?: 'asc' | 'desc',
): Promise<PagedResult<ProductItem>> {
  try {
    const params: any = { page, size };
    if (name && name.trim()) params.name = name.trim();

    if (filters) {
      if (filters.vendorId) params.vendorId = filters.vendorId;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.brand) params.brand = filters.brand;
      if (typeof filters.minPrice === 'number') params.minPrice = filters.minPrice;
      if (typeof filters.maxPrice === 'number') params.maxPrice = filters.maxPrice;
      if (typeof filters.minRating === 'number') params.minRating = filters.minRating;
      if (typeof filters.active === 'boolean') params.active = filters.active;
    }

    // support Spring Data pageable sort parameter: sort=field,desc
    if (sortField) {
      params.sort = `${sortField},${sortDir ?? 'desc'}`;
    }

    // Request products (relative path). axios.baseURL should include host and optional '/api' prefix.
    const res = await api.get('/products', { params });

    if (res.status === 403) {
      // Server requires authentication/role
      return { items: [], total: 0, page, size };
    }

    const apiResp = res.data ?? {};
    const pageObj = apiResp.data ?? apiResp; // PageResponse<ProductDto> expected

    const content = pageObj?.content ?? pageObj?.items ?? (Array.isArray(pageObj) ? pageObj : []);

    const totalRaw = pageObj?.totalElements ?? pageObj?.total ?? pageObj?.totalCount ?? res.headers?.['x-total-count'];
    const total = typeof totalRaw === 'number' ? totalRaw : (typeof totalRaw === 'string' && totalRaw ? Number(totalRaw) : (Array.isArray(content) ? content.length : 0));

    // backend PageResponse may use 'page' (as in Swagger) or 'number'
    const currentPage = typeof pageObj?.page === 'number' ? pageObj.page : (typeof pageObj?.number === 'number' ? pageObj.number : page);
    const pageSize = typeof pageObj?.size === 'number' ? pageObj.size : size;

    const items: ProductItem[] = (Array.isArray(content) ? content : []).map((p: any) => {
      const imageUrl = p.imageUrl ?? p.thumnail_url ?? p.thumbnailUrl ?? '';
      const normalized = normalizeImageUrl(imageUrl) ?? '';
      return ({
        productId: p.productId ?? p.product_id ?? (p.id ? String(p.id) : ''),
        vendorId: p.vendorId ?? p.vendor_id,
        vendorBusinessName: p.vendorBusinessName ?? p.vendor_business_name,
        categoryId: p.categoryId ?? p.category_id,
        categoryName: p.categoryName ?? p.category_name,
        name: p.name ?? p.productName ?? p.product_name ?? '',
        description: p.description,
        thumnail_url: normalized,
        price: typeof p.price === 'number' ? p.price : (p.price ? Number(p.price) : 0),
        stockQuantity: p.stockQuantity ?? p.stock_quantity,
        brand: p.brand,
        specifications: p.specifications,
        height: p.height,
        length: p.length,
        width: p.width,
        weight: p.weight,
        installationSupported: Boolean(p.installationSupported ?? p.installation_supported ?? false),
        regionSupported: p.regionSupported || p.region_supported || [],
        avgRating: p.avgRating ?? p.avg_rating,
        reviewCount: p.reviewCount ?? p.review_count,
        active: p.active ?? true,
        createdAt: p.createdAt || p.created_at,
        updatedAt: p.updatedAt || p.updated_at,
        raw: p,
      });
    });

    return { items, total, page: currentPage, size: pageSize };
  } catch (e: any) {
    console.warn('getProducts error', e);
    return { items: [], total: 0, page, size };
  }
}

export async function searchProducts(query: string): Promise<ProductItem[]> {
  try {
    if (!query || !query.trim()) {
      const p = await getProducts(0, 12);
      return p.items;
    }
    const p = await getProducts(0, 50, query);
    return p.items ?? [];
  } catch (e: any) {
    console.warn('searchProducts error', e);
    return [];
  }
}

export async function getProductById(productId: string): Promise<ProductItem | null> {
  try {
    if (!productId) return null;

    const res = await api.get(`/products/${productId}`);
    if (res.status === 403) return null;

    const apiResp = res.data ?? {};
    const payload = apiResp.data ?? apiResp;
    const p = payload ?? null;
    if (!p) return null;

    // normalize images: backend may return imageUrl (string) or images (array of paths)
    const rawImages: string[] = [];
    if (Array.isArray(p.images) && p.images.length) rawImages.push(...p.images.filter(Boolean));
    if (p.imageUrl) rawImages.push(p.imageUrl);

    const normalizedImages = rawImages.map((u) => normalizeImageUrl(u)).filter(Boolean) as string[];
    const pNormalized = { ...p, images: normalizedImages };

    const mapped: ProductItem = {
      productId: p.productId ?? p.product_id ?? (p.id ? String(p.id) : ''),
      vendorId: p.vendorId ?? p.vendor_id,
      vendorBusinessName: p.vendorBusinessName ?? p.vendor_business_name,
      categoryId: p.categoryId ?? p.category_id,
      categoryName: p.categoryName ?? p.category_name,
      name: p.name ?? p.productName ?? p.product_name ?? '',
      description: p.description,
      thumnail_url: normalizedImages[0] ?? normalizeImageUrl(p.imageUrl) ?? '',
      price: typeof p.price === 'number' ? p.price : (p.price ? Number(p.price) : 0),
      stockQuantity: p.stockQuantity ?? p.stock_quantity,
      brand: p.brand,
      specifications: p.specifications,
      height: p.height,
      length: p.length,
      width: p.width,
      weight: p.weight,
      installationSupported: Boolean(p.installationSupported ?? p.installation_supported ?? false),
      regionSupported: p.regionSupported || p.region_supported || [],
      avgRating: p.avgRating ?? p.avg_rating,
      reviewCount: p.reviewCount ?? p.review_count,
      active: p.active ?? true,
      createdAt: p.createdAt || p.created_at,
      updatedAt: p.updatedAt || p.updated_at,
      raw: pNormalized,
    };

    return mapped;
  } catch (e: any) {
    console.warn('getProductById error', e);
    return null;
  }
}

// Helper: convert possibly-relative image path to absolute URL using axios baseURL
export const normalizeImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const baseRaw = (api.defaults.baseURL as string) || '';
  // trim trailing slashes then strip a trailing '/api' if present
  const base = baseRaw.replace(/\/+$/g, '').replace(/\/api$/i, '');
  if (!base) return url;
  if (url.startsWith('/')) return `${base}${url}`;
  return `${base}/${url}`;
};
