import AsyncStorage from '@react-native-async-storage/async-storage';

// DeviceEventEmitter removed; CartContext handles updates now

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

export async function getCart(userId: string): Promise<CartLine[]> {
  try {
    const key = storageKeyFor(userId || 'guest');
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as CartLine[];
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
  if (!item || !item.product_id) throw new Error('Invalid product');
  if (typeof item.price !== 'number' || Number.isNaN(item.price)) throw new Error('Invalid price');
}

export async function addToCart(userId: string, item: Omit<CartLine, 'quantity'>, qty = 1): Promise<CartLine[]> {
  try {
    validateIncomingItem(item);
    const uid = userId || 'guest';
    const lines = await getCart(uid);
    const idx = lines.findIndex(l => l.product_id === item.product_id);
    if (idx >= 0) {
      lines[idx].quantity = Math.max(1, lines[idx].quantity + qty);
    } else {
      lines.push({ ...item, quantity: Math.max(1, qty) });
    }

    await saveCart(uid, lines);
    return lines;
  } catch (e) {
    console.warn('addToCart error', e);
    throw e;
  }
}

export async function updateQuantity(userId: string, productId: string, qty: number): Promise<CartLine[]> {
  try {
    const uid = userId || 'guest';
    const lines = await getCart(uid);
    const idx = lines.findIndex(l => l.product_id === productId);
    if (idx === -1) return lines;
    lines[idx].quantity = Math.max(0, Math.floor(qty));
    // if qty 0 remove
    const filtered = lines.filter(l => l.quantity > 0);
    await saveCart(uid, filtered);
    // saveCart already emits event
    return filtered;
  } catch (e) {
    console.warn('updateQuantity error', e);
    return [];
  }
}

export async function removeFromCart(userId: string, productId: string): Promise<CartLine[]> {
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
  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);
  const totalPrice = lines.reduce((s, l) => s + (l.price * l.quantity), 0);
  return { totalItems, totalPrice, lines };
}

export async function setInstallationRequest(userId: string, productId: string, installationRequest: boolean): Promise<CartLine[]> {
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
