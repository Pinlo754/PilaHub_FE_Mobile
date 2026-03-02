import { Image } from 'react-native';
import RNFS from 'react-native-fs';
import PhotoManipulator from 'react-native-photo-manipulator';
import ImageResizer from 'react-native-image-resizer';

/* ================== CONFIG ================== */

const API_KEY = 'c4MBCiaFFrrY3OxIxc5kdNtR7pcyqJOEDrFPuVSAl1l';
const ORG_ID = 'org_5sa0wtrQCsHApGOd8TluSz';

const TARGET_W = 1080;
const TARGET_H = 1920;
const REQ_ASPECT = 9 / 16;

/* ================== UTILS ================== */

async function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  const src = uri.startsWith('file://') ? uri : `file://${uri}`;
  return new Promise((resolve, reject) => {
    Image.getSize(src, (w, h) => resolve({ width: w, height: h }), reject);
  });
}

export async function fileToBase64(uri: string) {
  const path = uri.replace('file://', '');
  return RNFS.readFile(path, 'base64');
}

/* ================== CORE ================== */

export async function cropTo9by16Center(uri: string): Promise<string> {
  const src = uri.startsWith('file://') ? uri : `file://${uri}`;

  /** 1️⃣ RESIZE ONCE để normalize orientation + strip EXIF */
  const normalized = await ImageResizer.createResizedImage(
    src,
    3000,        // resize lớn để không vỡ ảnh
    3000,
    'JPEG',
    100,
    0,
    undefined,
    false        // ❗ strip EXIF (QUAN TRỌNG)
  );

  /** 2️⃣ Get size sau normalize */
  const { width, height } = await getImageSize(normalized.uri);
  const aspect = width / height;

  /** 3️⃣ Compute crop box chuẩn 9:16 */
  let cropW: number;
  let cropH: number;

  if (aspect > REQ_ASPECT) {
    cropH = height;
    cropW = Math.round(cropH * REQ_ASPECT);
  } else {
    cropW = width;
    cropH = Math.round(cropW / REQ_ASPECT);
  }

  const x = Math.round((width - cropW) / 2);
  const y = Math.round((height - cropH) / 2);

  /** 4️⃣ Crop center */
  const cropped = await PhotoManipulator.crop(normalized.uri, {
    x,
    y,
    width: cropW,
    height: cropH,
  });

  /** 5️⃣ Resize EXACT 1080x1920 */
  const resized = await ImageResizer.createResizedImage(
    cropped,
    TARGET_W,
    TARGET_H,
    'JPEG',
    90,
    0,
    undefined,
    false
  );

  /** 6️⃣ HARD VALIDATE */
  const finalSize = await getImageSize(resized.uri);

  if (finalSize.width !== TARGET_W || finalSize.height !== TARGET_H) {
    throw new Error(
      `❌ Invalid final size ${finalSize.width}x${finalSize.height}`
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
  }
) {
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
    `https://platform.bodygram.com/api/orgs/${ORG_ID}/scans`,
    {
      method: 'POST',
      headers: {
        Authorization: API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  const raw = await res.text();
  console.log('Bodygram status:', res.status);
  console.log('Bodygram raw:', raw);

  if (!res.ok) {
    throw new Error(raw);
  }

  return JSON.parse(raw);
}
