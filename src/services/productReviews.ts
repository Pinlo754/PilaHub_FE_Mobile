import api from '../hooks/axiosInstance';

export type ReviewItem = {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  author?: string;
  createdAt?: string;
  raw?: any;
};

export type PagedReviews = { items: ReviewItem[]; total: number; page: number; size: number };

export async function getProductReviews(productId: string, page = 0, size = 10): Promise<PagedReviews> {
  try {
    if (!productId) return { items: [], total: 0, page, size };

    // Call relative path; axios.baseURL should include host and optional '/api' prefix
    const res = await api.get(`/product-reviews/product/${productId}`, { params: { page, size } });
    const apiResp = res.data ?? {};
    const payload = apiResp.data ?? apiResp;

    const content = payload?.content ?? payload?.items ?? (Array.isArray(payload) ? payload : []);
    const totalRaw = payload?.totalElements ?? payload?.total ?? payload?.totalCount ?? res.headers?.['x-total-count'];
    const total = typeof totalRaw === 'number' ? totalRaw : (typeof totalRaw === 'string' && totalRaw ? Number(totalRaw) : (Array.isArray(content) ? content.length : 0));

    const currentPage = typeof payload?.page === 'number' ? payload.page : (typeof payload?.number === 'number' ? payload.number : page);
    const pageSize = typeof payload?.size === 'number' ? payload.size : size;

    const items: ReviewItem[] = (Array.isArray(content) ? content : []).map((r: any) => ({
      id: r.id ?? r.reviewId ?? String(r.id ?? ''),
      rating: typeof r.rating === 'number' ? r.rating : (r.rating ? Number(r.rating) : 0),
      title: r.title ?? r.subject ?? undefined,
      comment: r.comment ?? r.content ?? r.body ?? undefined,
      author: r.authorName ?? r.userName ?? r.user ?? undefined,
      createdAt: r.createdAt ?? r.createdDate ?? undefined,
      raw: r,
    }));

    return { items, total, page: currentPage, size: pageSize };
  } catch (e: any) {
    console.warn('getProductReviews error', e);
    return { items: [], total: 0, page, size };
  }
}
