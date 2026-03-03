import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'bodygram:saved:';

export type BodySavedInfo = {
  profileId?: string;
  savedAt: number;
  summary?: { height?: number; weight?: number };
  [k: string]: any;
};

export async function setBodySavedFor(userId: string, info: BodySavedInfo) {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(PREFIX + userId, JSON.stringify(info));
  } catch (e) {
    console.warn('setBodySavedFor failed', e);
  }
}

export async function getBodySavedFor(userId: string): Promise<BodySavedInfo | null> {
  if (!userId) return null;
  try {
    const raw = await AsyncStorage.getItem(PREFIX + userId);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('getBodySavedFor failed', e);
    return null;
  }
}

export async function hasBodySavedFor(userId: string): Promise<boolean> {
  const v = await getBodySavedFor(userId);
  return !!v;
}

export async function clearBodySavedFor(userId: string) {
  if (!userId) return;
  try {
    await AsyncStorage.removeItem(PREFIX + userId);
  } catch (e) {
    console.warn('clearBodySavedFor failed', e);
  }
}
