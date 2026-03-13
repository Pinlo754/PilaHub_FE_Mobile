import api from './axiosInstance';

export type CreateIoTDevicePayload = {
  deviceName: string;
  iotDeviceType: string;
  deviceIdentifier: string;
  connectionMethod: 'BLUETOOTH' | 'WIFI' | string;
};

export type IoTDeviceItem = {
  iotDeviceId: string;
  deviceName: string;
  iotDeviceType: string;
  deviceIdentifier: string;
  connectedAt?: string | null;
  connectionMethod?: string;
  lastSyncAt?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Register a new IoT device for the authenticated trainee.
 * POST /iot-devices
 */
export async function createIoTDevice(payload: CreateIoTDevicePayload) {
  const res = await api.post('/iot-devices', payload);
  return res.data;
}

/**
 * Get devices of the authenticated trainee.
 * Note: adjust endpoint if your backend uses a different path (e.g. /iot-devices/my-devices).
 */
export async function getMyIoTDevices(): Promise<IoTDeviceItem[]> {
  try {
    const res = await api.get('/iot-devices');
    return res.data?.data ?? [];
  } catch (err) {
    // fallback for older backend that used /iot-devices/my-devices
    try {
      const res2 = await api.get('/iot-devices/my-devices');
      return res2.data?.data ?? [];
    } catch {
      throw err;
    }
  }
}

/**
 * Delete a device by id
 */
export async function deleteIoTDevice(iotDeviceId: string) {
  const res = await api.delete(`/iot-devices/${iotDeviceId}`);
  return res.data;
}

export default { createIoTDevice, getMyIoTDevices, deleteIoTDevice };
