import api from './axiosInstance';

export type PackageItem = {
  id: string;
  title: string;
  price: string;
  desc: string;
  bullets: string[];
  raw?: any;
};

export type TraineeInfo = {
  traineeId: string;
  fullName: string;
  age?: number;
  gender?: string;
  avatarUrl?: string | null;
  workoutLevel?: string;
  workoutFrequency?: string;
  createdAt?: string;
};

export type SubscribedPackage = {
  packageId: string;
  packageName: string;
  description?: string;
  price?: number | string;
  durationInDays?: number;
  packageType?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SubscriptionItem = {
  subscriptionId: string;
  trainee: TraineeInfo;
  subscribedPackage: SubscribedPackage;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateIoTDevicePayload = {
  deviceName: string;
  iotDeviceType: string;
  deviceIdentifier: string;
  connectionMethod: 'BLUETOOTH' | 'WIFI' | string;
};

export async function getActivePackages(): Promise<PackageItem[]> {
  const res = await api.get('/packages/active');
  const data = res.data?.data ?? [];
  return data.map((p: any) => ({
    id: p.packageId,
    title: p.packageName,
    price: typeof p.price === 'number' ? p.price.toString() : (p.price ?? ''),
    desc: p.description ?? '',
    bullets: [
      `Loại: ${p.packageType ?? ''}`,
      `Thời lượng: ${p.durationInDays ?? ''} ngày`,
    ],
    raw: p,
  }));
}

export async function subscribeToPackage(packageId: string) {
  const res = await api.post('/subscriptions/subscribe', { packageId });
  return res.data;
}

export async function getMe() {
  const res = await api.get('/me');
  return res.data?.data ?? null;
}

export async function upgradeSubscription(newPackageId: string) {
  const res = await api.post('/subscriptions/upgrade', { newPackageId });
  return res.data;
}

export async function getMySubscriptions(): Promise<SubscriptionItem[]> {
  const res = await api.get('/subscriptions/my-subscriptions');
  const data = res.data?.data ?? [];
  return data.map((s: any) => ({
    subscriptionId: s.subscriptionId,
    trainee: s.trainee ?? {},
    subscribedPackage: s.subscribedPackage ?? {},
    status: s.status,
    startDate: s.startDate,
    endDate: s.endDate,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
}

export async function getMyActiveSubscription(): Promise<any | null> {
  const res = await api.get('/subscriptions/my-active-subscription');
  return res.data?.data ?? null;
}

export async function getUpgradeablePackages(): Promise<any[]> {
  const res = await api.get('/subscriptions/upgradeable-packages');
  const data = res.data?.data ?? [];
  // map into simple shape usable by UI
  return data.map((p: any) => ({
    packageId: p.packageInfo?.packageId ?? p.packageInfo?.id ?? null,
    packageInfo: p.packageInfo ?? {},
    originalPrice: p.originalPrice ?? null,
    prorationCredit: p.prorationCredit ?? null,
    finalPrice: p.finalPrice ?? null,
    discountPercentage: p.discountPercentage ?? null,
    discountDescription: p.discountDescription ?? null,
    raw: p,
  }));
}

export async function createIoTDevice(payload: CreateIoTDevicePayload) {
  const res = await api.post('/iot-devices', payload);
  return res.data;
}

export default { getActivePackages, subscribeToPackage, getMe, upgradeSubscription, getMySubscriptions, createIoTDevice, getUpgradeablePackages, getMyActiveSubscription };
