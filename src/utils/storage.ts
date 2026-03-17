import AsyncStorage from '@react-native-async-storage/async-storage';
const COMPLETED_KEY = 'ONBOARDING_COMPLETED';

export const saveOnboarding = async (value: any) => {
  await AsyncStorage.setItem('ONBOARDING', JSON.stringify(value));
};

export const loadOnboarding = async () => {
  const raw = await AsyncStorage.getItem('ONBOARDING');
  return raw ? JSON.parse(raw) : null;
};

export const clearOnboarding = async () => {
  await AsyncStorage.removeItem('ONBOARDING');
};

export const setOnboardingCompleted = async () => {
  await AsyncStorage.setItem(COMPLETED_KEY, 'true');
}
export const isOnboardingCompleted = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(COMPLETED_KEY);
  return value === 'true';
};
export const clearOnboardingCompleted = async () => {
  await AsyncStorage.removeItem(COMPLETED_KEY);
};

// Per-user onboarding helpers
export const setOnboardingCompletedFor = async (userId: string) => {
  if (!userId) return;
  await AsyncStorage.setItem(`${COMPLETED_KEY}:${userId}`, 'true');
};

export const isOnboardingCompletedFor = async (userId?: string): Promise<boolean> => {
  if (!userId) return isOnboardingCompleted();
  const key = `${COMPLETED_KEY}:${userId}`;
  const value = await AsyncStorage.getItem(key);
  if (value != null) return value === 'true';
  // fallback to global flag for backward compatibility
  return isOnboardingCompleted();
};

export const clearOnboardingCompletedFor = async (userId: string) => {
  if (!userId) return;
  await AsyncStorage.removeItem(`${COMPLETED_KEY}:${userId}`);
};