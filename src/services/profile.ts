import api from '../hooks/axiosInstance';

type ServiceResult<T = any> = { ok: true; data: T } | { ok: false; error: any };

type OnboardingData = Partial<{
  fullName: string;
  age: number;
  gender: string;
  avatarUrl: string;
  workoutLevel: string;
  workoutFrequency: string;
  [k: string]: any;
}>;

type BodyGramData = Record<string, any>;

function extractAndMap(obj: BodyGramData, mapping: Record<string, string>) {
  const result: Record<string, any> = {};
  const extras: Record<string, any> = {};

  Object.keys(obj || {}).forEach((k) => {
    const v = obj[k];
    const keyLower = k.toLowerCase();

    // find mapping by exact key or lowercase match
    const mappedKey = mapping[k] ?? mapping[keyLower];
    if (mappedKey) {
      result[mappedKey] = v;
      return;
    }

    // accept a few common variants
    const lowered = keyLower;
    if (lowered === 'height' || lowered === 'heightcm') {
      result.heightCm = v;
      return;
    }
    if (lowered === 'weight' || lowered === 'weightkg') {
      result.weightKg = v;
      return;
    }
    if (lowered.includes('bmi')) {
      result.bmi = v;
      return;
    }
    if (lowered.includes('bodyfat') || lowered.includes('body_fat') || lowered.includes('fat')) {
      result.bodyFatPercentage = v;
      return;
    }
    if (lowered.includes('muscle')) {
      result.muscleMassKg = v;
      return;
    }
    if (lowered.includes('waist')) {
      result.waistCm = v;
      return;
    }
    if (lowered.includes('hip') || lowered.includes('hips')) {
      result.hipCm = v;
      return;
    }

    // otherwise keep in extras
    extras[k] = v;
  });

  return { mapped: result, extras };
}

// helper: normalize gender to server enum values (FEMALE, MALE, OTHER)
function mapGenderToEnum(g?: string): string | undefined {
  if (g == null) return undefined;
  const u = String(g).trim().toUpperCase();
  if (u === 'FEMALE' || u === 'MALE' || u === 'OTHER') return u;
  if (u.startsWith('F')) return 'FEMALE';
  if (u.startsWith('M')) return 'MALE';
  return 'OTHER';
}

export function buildTraineeProfilePayload(onboarding: OnboardingData, bodyGram?: BodyGramData) {
  const payload: Record<string, any> = {};

  // copy common onboarding fields if present
  if (onboarding.fullName) payload.fullName = onboarding.fullName;
  if (onboarding.age != null) payload.age = onboarding.age;
  if (onboarding.gender) payload.gender = mapGenderToEnum(onboarding.gender);
  if (onboarding.avatarUrl) payload.avatarUrl = onboarding.avatarUrl;
  if (onboarding.workoutLevel) payload.workoutLevel = onboarding.workoutLevel;
  if (onboarding.workoutFrequency) payload.workoutFrequency = onboarding.workoutFrequency;

  // map some bodyGram fields into trainee profile if available (e.g., gender override, age)
  if (bodyGram) {
    // if bodyGram contains a fullName or gender/age, prefer onboarding but allow fallback
    if (!payload.fullName && (bodyGram.fullName || bodyGram.name)) {
      payload.fullName = bodyGram.fullName ?? bodyGram.name;
    }
    if (!payload.gender && (bodyGram.gender)) payload.gender = mapGenderToEnum(bodyGram.gender);
    if (!payload.age && (bodyGram.age)) payload.age = bodyGram.age;
  }

  // collect metadata: any leftover onboarding fields or bodyGram fields not used above
  const metadata: Record<string, any> = {};
  Object.keys(onboarding || {}).forEach((k) => {
    if (!['fullName', 'age', 'gender', 'avatarUrl', 'workoutLevel', 'workoutFrequency'].includes(k)) {
      metadata[k] = (onboarding as any)[k];
    }
  });

  if (bodyGram) {
    const { mapped, extras } = extractAndMap(bodyGram, {});
    // merge mapped into metadata only if not already used
    Object.keys(mapped).forEach((k) => {
      if (!(k in payload)) {
        // some mapped fields may be more health related; keep in metadata for trainee profile
        metadata[k] = mapped[k];
      }
    });
    Object.assign(metadata, extras);
  }

  if (Object.keys(metadata).length > 0) payload.metadata = JSON.stringify(metadata);

  return payload;
}

// helpers to find and normalize numeric height/weight values
function findNumericInPaths(obj: any, paths: string[][]): number | undefined {
  if (!obj) return undefined;
  for (const path of paths) {
    let cur: any = obj;
    let ok = true;
    for (const p of path) {
      if (cur == null) { ok = false; break; }
      cur = cur[p];
    }
    if (!ok) continue;
    const n = Number(cur);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function normalizeHeightToCm(raw?: any): number | undefined {
  if (raw == null) return undefined;
  const n = Number(raw);
  if (Number.isNaN(n)) return undefined;
  // heuristics
  if (n > 1000) return Math.round((n / 10) * 10) / 10; // mm -> cm
  if (n >= 300) return Math.round((n / 10) * 10) / 10; // mm-ish -> cm
  if (n >= 50) return Math.round(n * 10) / 10; // cm
  if (n > 1 && n < 4) return Math.round(n * 100 * 10) / 10; // meters -> cm
  return undefined;
}

function normalizeWeightToKg(raw?: any): number | undefined {
  if (raw == null) return undefined;
  const n = Number(raw);
  if (Number.isNaN(n)) return undefined;
  // heuristics
  if (n > 10000) return Math.round((n / 1000) * 10) / 10; // grams -> kg
  if (n >= 1000 && n <= 10000) return Math.round((n / 1000) * 10) / 10; // grams -> kg
  if (n >= 3) return Math.round(n * 10) / 10; // assume kg
  return undefined;
}

export function buildHealthProfilePayload(bodyGram: BodyGramData, source = 'BodyGram') {
  const mapping: Record<string, string> = {
    heightcm: 'heightCm',
    weightkg: 'weightKg',
    bmi: 'bmi',
    bodyfatpercentage: 'bodyFatPercentage',
    musclemasskg: 'muscleMassKg',
    waistcm: 'waistCm',
    hipcm: 'hipCm',
  };

  const { mapped, extras } = extractAndMap(bodyGram, mapping);

  // try multiple places for height/weight when missing
  let heightRaw = mapped.heightCm ?? mapped.height;
  let weightRaw = mapped.weightKg ?? mapped.weight;

  if (heightRaw == null) {
    heightRaw = findNumericInPaths(bodyGram, [
      ['height'],
      ['heightCm'],
      ['input', 'photoScan', 'height'],
      ['input', 'height'],
      ['metadata', 'height'],
      ['metadata', 'heightCm'],
      ['bodyComposition', 'height'],
    ]);
  }

  if (weightRaw == null) {
    weightRaw = findNumericInPaths(bodyGram, [
      ['weight'],
      ['weightKg'],
      ['input', 'photoScan', 'weight'],
      ['input', 'weight'],
      ['metadata', 'weight'],
      ['metadata', 'weightKg'],
      ['bodyComposition', 'weightKg'],
      ['bodyComposition', 'weight'],
    ]);
  }

  const heightCm = normalizeHeightToCm(heightRaw);
  const weightKg = normalizeWeightToKg(weightRaw);

  const payload: Record<string, any> = {
    source,
    ...mapped,
  };

  if (heightCm != null) payload.heightCm = heightCm;
  if (weightKg != null) payload.weightKg = weightKg;

  // metadata: keep extras and useful raw fields for debugging
  const metadata: Record<string, any> = { ...extras };
  if (Array.isArray(bodyGram?.measurements)) metadata.measurements = bodyGram.measurements;
  if (bodyGram?.input) metadata.input = bodyGram.input;

  if (Object.keys(metadata).length > 0) payload.metadata = JSON.stringify(metadata);

  if (payload.heightCm == null || payload.weightKg == null) {
    console.warn('buildHealthProfilePayload missing height or weight (normalized)', {
      heightRaw,
      weightRaw,
      heightCm: payload.heightCm,
      weightKg: payload.weightKg,
      sampleKeys: Object.keys(bodyGram || {}).slice(0, 20),
    });
  }

  return payload;
}

export async function createTraineeProfile(onboarding: OnboardingData, bodyGram?: BodyGramData): Promise<ServiceResult> {
  try {
    const payload = buildTraineeProfilePayload(onboarding, bodyGram);
    const res = await api.post('/trainees/profile', payload);
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

export async function createHealthProfile(bodyGram: BodyGramData, source = 'BodyGram'): Promise<ServiceResult> {
  try {
    const payload = buildHealthProfilePayload(bodyGram, source);
    const res = await api.post('/health-profiles/my-profiles', payload);
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

export async function submitProfiles(onboarding: OnboardingData, bodyGram?: BodyGramData, source = 'BodyGram') : Promise<ServiceResult<{ trainee?: any; health?: any }>> {
   try {
     const results: any = {};

     // create trainee profile (if onboarding has meaningful fields)
     const traineePayload = buildTraineeProfilePayload(onboarding, bodyGram);
     if (Object.keys(traineePayload).length > 0) {
       const t = await createTraineeProfile(onboarding, bodyGram);
       if (!t.ok) {
         // If server returns 500/internal error, retry with minimal payload (some backends fail on metadata)
         const errObj = t.error;
         console.warn('createTraineeProfile failed, attempting minimal retry', errObj);
         const isInternal = (errObj && (errObj.errorCode === 'INTERNAL_SERVER_ERROR' || errObj.message?.toLowerCase?.().includes('internal')));
         if (isInternal) {
           try {
             const minimal: any = {};
             if (onboarding.fullName) minimal.fullName = onboarding.fullName;
             if (onboarding.age != null) minimal.age = onboarding.age;
             if (onboarding.gender) minimal.gender = mapGenderToEnum(onboarding.gender);
             console.warn('Retrying createTraineeProfile with minimal payload', minimal);
             const retry = await createTraineeProfile(minimal as any, undefined);
             if (retry.ok) {
               results.trainee = retry.data;
             } else {
               return { ok: false, error: { step: 'trainee', error: t.error, retry: retry.error } };
             }
           } catch (e: any) {
             return { ok: false, error: { step: 'trainee', error: t.error, retryThrown: e } };
           }
           // continue to health creation
         } else {
          // If trainee already exists, skip creating trainee and continue to health profile
          const alreadyExists = errObj && (errObj.errorCode === 'INVALID_ARGUMENT' || errObj.message?.toLowerCase?.().includes('already exists'));
          if (alreadyExists) {
            console.warn('Trainee already exists — skipping trainee creation and continuing to health profile', errObj);
            // optionally attach info about skipped trainee
            results.trainee = { skipped: true, reason: 'already_exists' } as any;
            // continue to health creation
          } else {
            return { ok: false, error: { step: 'trainee', error: t.error } };
          }
         }
       } else {
         results.trainee = t.data;
       }
     }

     // create health profile from bodyGram
     if (bodyGram && Object.keys(bodyGram).length > 0) {
       const h = await createHealthProfile(bodyGram, source);
       if (!h.ok) return { ok: false, error: { step: 'health', error: h.error } };
       results.health = h.data;
     }

     return { ok: true, data: results };
   } catch (e: any) {
     return { ok: false, error: e.response?.data ?? e.message ?? e };
   }
 }
