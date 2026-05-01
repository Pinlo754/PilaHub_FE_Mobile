import AsyncStorage from '@react-native-async-storage/async-storage';

export type CartLine = {
  product_id: string;
  product_name: string;
  thumnail_url?: string;
  price: number;
  quantity: number;
  raw?: any;
  installationRequest?: boolean;
};

const CART_KEY_PREFIX = 'CART_';

const storageKeyFor = (userId: string) => `${CART_KEY_PREFIX}${userId}`;

function getCartStock(item: Partial<CartLine> | any): number | null {
  const raw = item?.raw ?? {};

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

  if (value === undefined || value === null || value === '') return null;

  const n = Number(value);

  if (!Number.isFinite(n)) return null;

  return Math.max(0, Math.floor(n));
}

function normalizeQuantity(qty: any) {
  const n = Number(qty);

  if (!Number.isFinite(n)) return 1;

  return Math.max(1, Math.floor(n));
}

function clampQuantityByStock(item: Partial<CartLine> | any, qty: number) {
  const stock = getCartStock(item);
  const normalizedQty = normalizeQuantity(qty);

  if (stock !== null) {
    if (stock <= 0) {
      throw new Error('OUT_OF_STOCK');
    }

    return Math.min(normalizedQty, stock);
  }

  return normalizedQty;
}

function mergeRaw(oldRaw: any, newRaw: any) {
  return {
    ...(oldRaw ?? {}),
    ...(newRaw ?? {}),
  };
}

export async function getCart(userId: string): Promise<CartLine[]> {
  try {
    const key = storageKeyFor(userId || 'guest');
    const raw = await AsyncStorage.getItem(key);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed as CartLine[];
  } catch (e) {
    console.warn('getCart error', e);
    return [];
  }
}

export async function saveCart(userId: string, lines: CartLine[]): Promise<boolean> {
  try {
    const key = storageKeyFor(userId || 'guest');
    await AsyncStorage.setItem(key, JSON.stringify(lines));
    return true;
  } catch (e) {
    console.warn('saveCart error', e);
    return false;
  }
}

function validateIncomingItem(item: Partial<CartLine>) {
  if (!item || !item.product_id) {
    throw new Error('Invalid product');
  }

  const price = Number(item.price);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid price');
  }
}

export async function addToCart(
  userId: string,
  item: Omit<CartLine, 'quantity'>,
  qty = 1,
): Promise<CartLine[]> {
  try {
    validateIncomingItem(item);

    const uid = userId || 'guest';
    const lines = await getCart(uid);

    const idx = lines.findIndex(l => l.product_id === item.product_id);

    if (idx >= 0) {
      const mergedItem = {
        ...lines[idx],
        ...item,
        raw: mergeRaw(lines[idx].raw, item.raw),
      };

      const nextQty = Number(lines[idx].quantity || 0) + normalizeQuantity(qty);
      const finalQty = clampQuantityByStock(mergedItem, nextQty);

      lines[idx] = {
        ...mergedItem,
        quantity: finalQty,
        installationRequest:
          lines[idx].installationRequest ?? item.installationRequest ?? false,
      };
    } else {
      const finalQty = clampQuantityByStock(item, qty);

      lines.push({
        ...item,
        price: Number(item.price),
        quantity: finalQty,
        installationRequest: item.installationRequest ?? false,
      });
    }

    await saveCart(uid, lines);

    return lines;
  } catch (e) {
    console.warn('addToCart error', e);
    throw e;
  }
}

export async function updateQuantity(
  userId: string,
  productId: string,
  qty: number,
): Promise<CartLine[]> {
  try {
    const uid = userId || 'guest';
    const lines = await getCart(uid);

    const idx = lines.findIndex(l => l.product_id === productId);

    if (idx === -1) return lines;

    const nextQty = Math.max(0, Math.floor(Number(qty) || 0));

    if (nextQty <= 0) {
      const filtered = lines.filter(l => l.product_id !== productId);
      await saveCart(uid, filtered);
      return filtered;
    }

    const stock = getCartStock(lines[idx]);

    if (stock !== null) {
      if (stock <= 0) {
        throw new Error('OUT_OF_STOCK');
      }

      lines[idx].quantity = Math.min(nextQty, stock);
    } else {
      lines[idx].quantity = nextQty;
    }

    await saveCart(uid, lines);

    return lines;
  } catch (e) {
    console.warn('updateQuantity error', e);
    throw e;
  }
}

export async function removeFromCart(
  userId: string,
  productId: string,
): Promise<CartLine[]> {
  try {
    const uid = userId || 'guest';
    const lines = await getCart(uid);

    const filtered = lines.filter(l => l.product_id !== productId);

    await saveCart(uid, filtered);

    return filtered;
  } catch (e) {
    console.warn('removeFromCart error', e);
    return [];
  }
}

export async function clearCart(userId: string): Promise<boolean> {
  try {
    const key = storageKeyFor(userId || 'guest');

    await AsyncStorage.removeItem(key);

    return true;
  } catch (e) {
    console.warn('clearCart error', e);
    return false;
  }
}

export async function getCartSummary(userId: string) {
  const lines = await getCart(userId);

  const totalItems = lines.reduce((s, l) => {
    return s + Number(l.quantity || 0);
  }, 0);

  const totalPrice = lines.reduce((s, l) => {
    return s + Number(l.price || 0) * Number(l.quantity || 0);
  }, 0);

  return {
    totalItems,
    totalPrice,
    lines,
  };
}

export async function setInstallationRequest1(
  userId: string,
  productId: string,
  installationRequest: boolean,
): Promise<CartLine[]> {
  try {
    const uid = userId || 'guest';
    const lines = await getCart(uid);

    const idx = lines.findIndex(l => l.product_id === productId);

    if (idx === -1) return lines;

    lines[idx].installationRequest = Boolean(installationRequest);

    await saveCart(uid, lines);

    return lines;
  } catch (e) {
    console.warn('setInstallationRequest error', e);
    return [];
  }
}