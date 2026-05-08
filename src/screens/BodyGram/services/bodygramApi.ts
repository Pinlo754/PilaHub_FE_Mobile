import { Image } from 'react-native';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

/* ================== CONFIG (fallback mặc định) ================== */
const DEFAULT_API_KEY = '9R1GgY13odM55yFxVeyLCOecDzbZVK9LNER1EdkADCH';
const DEFAULT_ORG_ID = 'org_4vhpBueow8UPqkHE7owZhb';
const TARGET_W = 1080;
const TARGET_H = 1920;

/* ================== TYPES ================== */
export interface BodygramCredentials {
  apiKey: string;
  orgId: string;
}

/* ================== UTILS ================== */
async function getImageSize(
  uri: string,
): Promise<{ width: number; height: number }> {
  const src = uri.startsWith('file://') ? uri : `file://${uri}`;
  return new Promise((resolve, reject) => {
    Image.getSize(src, (w, h) => resolve({ width: w, height: h }), reject);
  });
}

export async function fileToBase64(uri: string) {
  const path = uri.replace('file://', '');
  return RNFS.readFile(path, 'base64');
}

function sanitizeBodygramResponse(response: any) {
  if (!response?.entry) return response;
  return {
    ...response,
    entry: {
      ...response.entry,
      avatar: response.entry.avatar
        ? {
            ...response.entry.avatar,
            data: response.entry.avatar.data
              ? `[hidden avatar data, length=${response.entry.avatar.data.length}]`
              : response.entry.avatar.data,
          }
        : response.entry.avatar,
    },
  };
}

function sanitizeRawBodygramText(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(sanitizeBodygramResponse(parsed), null, 2);
  } catch {
    return raw;
  }
}

/* ================== CORE ================== */
export async function cropTo9by16Center(uri: string): Promise<string> {
  const src = uri.startsWith('file://') ? uri : `file://${uri}`;

  /** 1️⃣ Normalize orientation + strip EXIF */
  const normalized = await ImageResizer.createResizedImage(
    src,
    4000,
    4000,
    'JPEG',
    100,
    0,
    undefined,
    false,
  );

  const { width, height } = await getImageSize(normalized.uri);
  console.log(`Normalized: ${width}x${height}`);

  /** 2️⃣ Resize về 1080x1920 với mode stretch */
  const resized = await ImageResizer.createResizedImage(
    normalized.uri,
    TARGET_W,
    TARGET_H,
    'JPEG',
    90,
    0,
    undefined,
    false,
    { mode: 'stretch', onlyScaleDown: false },
  );

  /** 3️⃣ VALIDATE */
  const finalSize = await getImageSize(resized.uri);
  console.log(`✅ Final size: ${finalSize.width}x${finalSize.height}`);

  if (finalSize.width !== TARGET_W || finalSize.height !== TARGET_H) {
    throw new Error(
      `❌ Invalid final size ${finalSize.width}x${finalSize.height} (expected ${TARGET_W}x${TARGET_H})`,
    );
  }

  return resized.uri;
}

/* ================== UPLOAD ================== */
export async function uploadToBodygram(
  frontUri: string,
  sideUri: string,
  body: {
    age: number;
    gender: 'male' | 'female';
    height: number;
    weight: number;
  },
  credentials?: BodygramCredentials, // 👈 optional, nếu có sẽ override hardcode
) {
  // Dùng credentials tùy chỉnh nếu có, không thì fallback về mặc định
  const API_KEY_USED =
    credentials?.apiKey?.trim() || DEFAULT_API_KEY;
  const ORG_ID_USED =
    credentials?.orgId?.trim() || DEFAULT_ORG_ID;

  console.log(
    'uploadToBodygram using orgId:',
    ORG_ID_USED === DEFAULT_ORG_ID ? '(default)' : '(custom)',
  );

  const front = await cropTo9by16Center(frontUri);
  const side = await cropTo9by16Center(sideUri);

  console.log('FRONT FINAL:', await getImageSize(front));
  console.log('SIDE FINAL:', await getImageSize(side));

  const frontBase64 = await fileToBase64(front);
  const sideBase64 = await fileToBase64(side);

  const payload = {
    customScanId: `scan_${Date.now()}`,
    photoScan: {
      ...body,
      frontPhoto: frontBase64,
      rightPhoto: sideBase64,
    },
  };

  const res = await fetch(
    `https://platform.bodygram.com/api/orgs/${ORG_ID_USED}/scans`,
    {
      method: 'POST',
      headers: {
        Authorization: API_KEY_USED,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );

  const raw = await res.text();
  console.log('Bodygram status:', res.status);
  console.log('Bodygram raw:', sanitizeRawBodygramText(raw));

  if (!res.ok) {
    throw new Error(sanitizeRawBodygramText(raw));
  }

  const parsed = JSON.parse(raw);
  console.log('Bodygram parsed:', sanitizeBodygramResponse(parsed));
  return parsed;
}