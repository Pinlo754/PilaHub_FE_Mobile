import { CartLine } from '../../../services/cart';

export const CART_RULES = {
  NEAR_EXPIRY_DAYS: 30,
};

export type CartValidationResult = {
  stock: number | null;
  expiryDate: Date | null;
  daysUntilExpiry: number | null;
  vendorId: string | null;
  vendorName: string;
  productStatus: string | null;
  requireExpiryDate: boolean;

  isOutOfStock: boolean;
  isExpired: boolean;
  isNearExpiry: boolean;
  isMissingExpiry: boolean;
  isMissingVendor: boolean;
  isInactive: boolean;
  isInvalidPrice: boolean;
  isInvalidQuantity: boolean;
  isQuantityExceedStock: boolean;

  canSelect: boolean;
  canCheckout: boolean;
  warnings: string[];
  errors: string[];
};

export const getRaw = (item: CartLine | any) => {
  return item?.raw ?? {};
};

export const normalizeText = (value: any): string => {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Dựa trên category hiện tại của app:
 *
 * CẦN HẠN SỬ DỤNG:
 * - Vitamin
 * - Tăng cường hiệu suất
 * - Protein
 * - Thực phẩm bổ sung
 *
 * KHÔNG CẦN HẠN SỬ DỤNG:
 * - Gói Tập
 * - Thảm
 * - Máy tập
 * - Phụ kiện
 * - Khóa học
 * - Thiết bị
 * - Voucher
 * - Pilates Equipment Test
 */
export const isExpiryRequiredProduct = (item: CartLine | any): boolean => {
  const raw = getRaw(item);

  const categoryName = normalizeText(
    raw.categoryName ??
      raw.category_name ??
      raw.category ??
      raw.productCategory ??
      raw.product_category,
  );

  const productType = normalizeText(
    raw.productType ??
      raw.product_type ??
      raw.type ??
      raw.itemType ??
      raw.item_type,
  );

  const productName = normalizeText(
    item?.product_name ??
      raw.name ??
      raw.productName ??
      raw.product_name,
  );

  const text = `${categoryName} ${productType} ${productName}`;

  const nonExpiryCategories = [
    'goi tap',
    'tham',
    'may tap',
    'phu kien',
    'khoa hoc',
    'thiet bi',
    'voucher',
    'pilates equipment test',
  ];

  const expiryRequiredCategories = [
    'vitamin',
    'tang cuong hieu suat',
    'protein',
    'thuc pham bo sung',
  ];

  const isNonExpiryCategory = nonExpiryCategories.some(category =>
    categoryName.includes(category),
  );

  if (isNonExpiryCategory) {
    return false;
  }

  const isExpiryCategory = expiryRequiredCategories.some(category =>
    categoryName.includes(category),
  );

  if (isExpiryCategory) {
    return true;
  }

  /**
   * Fallback theo tên/type sản phẩm
   * Phòng trường hợp backend chưa trả categoryName rõ ràng.
   */
  const nonExpiryKeywords = [
    'goi tap',
    'tham',
    'may tap',
    'phu kien',
    'khoa hoc',
    'thiet bi',
    'voucher',
    'pilates equipment',
    'equipment',
    'machine',
    'device',
    'tool',
    'accessory',
    'mat',
  ];

  const expiryRequiredKeywords = [
    'vitamin',
    'protein',
    'whey',
    'collagen',
    'omega',
    'supplement',
    'thuc pham bo sung',
    'thuc pham chuc nang',
    'tang cuong hieu suat',
    'pre workout',
    'pre-workout',
    'bcaa',
    'creatine',
    'vien uong',
    'bot',
    'sua tang co',
    'sua protein',
  ];

  const isClearlyNonExpiry = nonExpiryKeywords.some(keyword =>
    text.includes(keyword),
  );

  if (isClearlyNonExpiry) {
    return false;
  }

  return expiryRequiredKeywords.some(keyword => text.includes(keyword));
};

export const getProductStock = (item: CartLine | any): number | null => {
  const raw = getRaw(item);

  const value =
    raw.stockQuantity ??
    raw.stock_quantity ??
    raw.stock ??
    raw.availableQuantity ??
    raw.available_quantity ??
    raw.availableStock ??
    raw.available_stock ??
    raw.inventoryQuantity ??
    raw.inventory_quantity ??
    item?.stockQuantity ??
    item?.stock;

  const n = Number(value);

  if (!Number.isFinite(n)) return null;

  return Math.max(0, Math.floor(n));
};

export const getVendorId = (item: CartLine | any): string | null => {
  const raw = getRaw(item);

  const value =
    raw.vendorId ??
    raw.vendor_id ??
    raw.merchantId ??
    raw.merchant_id ??
    raw.shopId ??
    raw.shop_id ??
    item?.vendorId ??
    item?.vendor_id ??
    item?.shopId ??
    item?.shop_id;

  if (value === null || value === undefined || value === '') return null;

  return String(value);
};

export const getVendorName = (item: CartLine | any): string => {
  const raw = getRaw(item);

  return String(
    raw.vendorBusinessName ??
      raw.vendor_business_name ??
      raw.businessName ??
      raw.business_name ??
      raw.shopName ??
      raw.shop_name ??
      raw.merchantName ??
      raw.merchant_name ??
      item?.vendorBusinessName ??
      item?.shop_name ??
      'Cửa hàng',
  );
};

export const getProductStatus = (item: CartLine | any): string | null => {
  const raw = getRaw(item);

  const value =
    raw.status ??
    raw.productStatus ??
    raw.product_status ??
    raw.state ??
    raw.isActive ??
    raw.is_active ??
    raw.allowSale ??
    raw.allow_sale ??
    raw.isAvailable ??
    raw.is_available;

  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'boolean') {
    return value ? 'ACTIVE' : 'INACTIVE';
  }

  return String(value).toUpperCase();
};

export const isInactiveStatus = (status: string | null): boolean => {
  if (!status) return false;

  return [
    'INACTIVE',
    'DISABLED',
    'DELETED',
    'REMOVED',
    'STOPPED',
    'STOP_SELLING',
    'UNAVAILABLE',
    'OUT_OF_SALE',
    'FALSE',
  ].includes(status);
};

export const getExpiryDate = (item: CartLine | any): Date | null => {
  const raw = getRaw(item);

  const value =
    raw.expiryDate ??
    raw.expiredDate ??
    raw.expirationDate ??
    raw.expiry_date ??
    raw.expired_date ??
    raw.expiration_date ??
    raw.bestBeforeDate ??
    raw.best_before_date ??
    raw.useBeforeDate ??
    raw.use_before_date ??
    raw.mfgExpiryDate ??
    raw.mfg_expiry_date;

  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
};

export const formatDateVN = (date?: Date | null): string => {
  if (!date) return 'Chưa cập nhật';

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const getDaysUntilExpiry = (date?: Date | null): number | null => {
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(date);
  expiry.setHours(0, 0, 0, 0);

  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const validateCartItem = (item: CartLine): CartValidationResult => {
  const stock = getProductStock(item);
  const expiryDate = getExpiryDate(item);
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
  const vendorId = getVendorId(item);
  const vendorName = getVendorName(item);
  const productStatus = getProductStatus(item);
  const requireExpiryDate = isExpiryRequiredProduct(item);

  const price = Number(item.price);
  const quantity = Number(item.quantity);

  const isOutOfStock = stock !== null && stock <= 0;

  const isExpired =
    requireExpiryDate &&
    daysUntilExpiry !== null &&
    daysUntilExpiry <= 0;

  const isNearExpiry =
    requireExpiryDate &&
    daysUntilExpiry !== null &&
    daysUntilExpiry > 0 &&
    daysUntilExpiry <= CART_RULES.NEAR_EXPIRY_DAYS;

  const isMissingExpiry = requireExpiryDate && !expiryDate;
  const isMissingVendor = !vendorId;
  const isInactive = isInactiveStatus(productStatus);
  const isInvalidPrice = !Number.isFinite(price) || price <= 0;
  const isInvalidQuantity = !Number.isFinite(quantity) || quantity <= 0;

  const isQuantityExceedStock =
    stock !== null &&
    Number.isFinite(quantity) &&
    quantity > stock;

  const errors: string[] = [];
  const warnings: string[] = [];

  if (isInactive) errors.push('Sản phẩm đã ngừng bán');
  if (isOutOfStock) errors.push('Sản phẩm đã hết hàng');
  if (isExpired) errors.push('Sản phẩm đã hết hạn sử dụng');
  if (isMissingExpiry) errors.push('Thiếu hạn sử dụng');
  if (isMissingVendor) errors.push('Thiếu thông tin nhà bán');
  if (isInvalidPrice) errors.push('Giá sản phẩm không hợp lệ');
  if (isInvalidQuantity) errors.push('Số lượng không hợp lệ');
  if (isQuantityExceedStock) errors.push(`Số lượng vượt tồn kho, chỉ còn ${stock}`);

  if (isNearExpiry && daysUntilExpiry !== null) {
    warnings.push(`Sắp hết hạn trong ${daysUntilExpiry} ngày`);
  }

  if (stock !== null && stock > 0 && stock <= 5) {
    warnings.push(`Tồn kho thấp, chỉ còn ${stock}`);
  }

  const canCheckout = errors.length === 0;

  return {
    stock,
    expiryDate,
    daysUntilExpiry,
    vendorId,
    vendorName,
    productStatus,
    requireExpiryDate,

    isOutOfStock,
    isExpired,
    isNearExpiry,
    isMissingExpiry,
    isMissingVendor,
    isInactive,
    isInvalidPrice,
    isInvalidQuantity,
    isQuantityExceedStock,

    canSelect: canCheckout,
    canCheckout,
    warnings,
    errors,
  };
};

export const getStockLabel = (validation: CartValidationResult): string => {
  if (validation.stock === null) return 'Chưa rõ tồn kho';
  if (validation.stock <= 0) return 'Hết hàng';
  if (validation.stock <= 5) return `Chỉ còn ${validation.stock}`;
  return `Còn ${validation.stock}`;
};

export const getExpiryLabel = (validation: CartValidationResult): string => {
  if (!validation.requireExpiryDate && !validation.expiryDate) {
    return 'Không yêu cầu';
  }

  if (!validation.expiryDate) return 'Chưa có HSD';

  if (validation.daysUntilExpiry !== null && validation.daysUntilExpiry <= 0) {
    return 'Đã hết hạn';
  }

  if (validation.isNearExpiry && validation.daysUntilExpiry !== null) {
    return `Còn ${validation.daysUntilExpiry} ngày`;
  }

  return formatDateVN(validation.expiryDate);
};

export const getMainInvalidReason = (
  validation: CartValidationResult,
): string | null => {
  if (validation.errors.length > 0) return validation.errors[0];
  if (validation.warnings.length > 0) return validation.warnings[0];
  return null;
};