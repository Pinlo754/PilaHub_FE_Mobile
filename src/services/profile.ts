import api from '../hooks/axiosInstance';

type ServiceResult<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: any };

type OnboardingData = Partial<{
  fullName: string;
  age: number;
  gender: string;
  avatarUrl: string;
  workoutLevel: string;
  workoutFrequency: string;
  height: number;
  weight: number;
  heightUnit: string;
  weightUnit: string;
  [k: string]: any;
}>;

type BodyGramData = Record<string, any>;

export type HealthProfilePayload = {
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  bodyFatPercentage: number | null;
  muscleMassKg: number | null;
  waistCm: number | null;
  hipCm: number | null;
  source: string;
  metadata: string;
};

function extractAndMap(obj: BodyGramData, mapping: Record<string, string>) {
  const result: Record<string, any> = {};
  const extras: Record<string, any> = {};

  Object.keys(obj || {}).forEach((k) => {
    const v = obj[k];
    const keyLower = k.toLowerCase();

    const mappedKey = mapping[k] ?? mapping[keyLower];

    if (mappedKey) {
      result[mappedKey] = v;
      return;
    }

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

    if (
      lowered.includes('bodyfat') ||
      lowered.includes('body_fat') ||
      lowered.includes('fat')
    ) {
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

    extras[k] = v;
  });

  return { mapped: result, extras };
}

function mapGenderToEnum(g?: string): string | undefined {
  if (g == null) return undefined;

  const u = String(g).trim().toUpperCase();

  if (u === 'FEMALE' || u === 'MALE' || u === 'OTHER') return u;
  if (u.startsWith('F')) return 'FEMALE';
  if (u.startsWith('M')) return 'MALE';

  return 'OTHER';
}

function toNumber(value: any): number | null {
  if (value == null || value === '') return null;

  const n = Number(value);

  if (Number.isNaN(n)) return null;

  return n;
}

function round1(value: number | null): number | null {
  if (value == null) return null;

  return Math.round(value * 10) / 10;
}

function normalizeBodygramHeightCm(value?: number | null): number | null {
  const n = toNumber(value);

  if (n == null) return null;

  if (n > 1000) {
    return round1(n / 10);
  }

  return round1(n);
}

function normalizeBodygramWeightKg(value?: number | null): number | null {
  const n = toNumber(value);

  if (n == null) return null;

  if (n > 500) {
    return round1(n / 1000);
  }

  return round1(n);
}

function calculateBmiForPayload(
  heightCm?: number | null,
  weightKg?: number | null,
): number | null {
  if (!heightCm || !weightKg) return null;

  const h = heightCm / 100;

  if (h <= 0) return null;

  return round1(weightKg / (h * h));
}

function gramToKg(value?: number | null): number | null {
  const n = toNumber(value);

  if (n == null) return null;

  return round1(n / 1000);
}

function getMeasurementCm(
  measurements: any[],
  measurementName: string,
): number | null {
  const item = measurements.find((m) => m?.name === measurementName);

  if (!item) return null;

  const value = toNumber(item.value);

  if (value == null) return null;

  const unit = String(item.unit || '').toLowerCase();

  if (unit === 'mm') return round1(value / 10);
  if (unit === 'cm') return round1(value);

  return round1(value);
}

export function mapBodygramToHealthProfilePayload(params: {
  bodyGram: BodyGramData;
  onboarding?: OnboardingData;
  source?: string;
}): HealthProfilePayload {
  const { bodyGram, onboarding, source = 'BodyGram' } = params;

  const entry = bodyGram?.entry ?? bodyGram ?? {};
  const input = entry?.input?.photoScan ?? entry?.input ?? {};

  const measurements: any[] = Array.isArray(entry?.measurements)
    ? entry.measurements
    : [];

  const heightCm =
    normalizeBodygramHeightCm(onboarding?.height) ??
    normalizeBodygramHeightCm(input?.height);

  const weightKg =
    normalizeBodygramWeightKg(onboarding?.weight) ??
    normalizeBodygramWeightKg(input?.weight);

  const bmi = calculateBmiForPayload(heightCm, weightKg);

  const bodyFatPercentage =
    entry?.bodyComposition?.bodyFatPercentage != null
      ? round1(Number(entry.bodyComposition.bodyFatPercentage))
      : null;

  const muscleMassKg =
    entry?.bodyComposition?.skeletalMuscleMass != null
      ? gramToKg(entry.bodyComposition.skeletalMuscleMass)
      : null;

  const waistCm =
    getMeasurementCm(measurements, 'waistGirth') ??
    getMeasurementCm(measurements, 'bellyWaistGirth');

  const hipCm = getMeasurementCm(measurements, 'hipGirth');

  const bustCm = getMeasurementCm(measurements, 'bustGirth');
  const underBustCm = getMeasurementCm(measurements, 'underBustGirth');
  const bicepCm = getMeasurementCm(measurements, 'upperArmGirthR');
  const thighCm = getMeasurementCm(measurements, 'thighGirthR');
  const midThighCm = getMeasurementCm(measurements, 'midThighGirthR');
  const shoulderCm = getMeasurementCm(
    measurements,
    'acrossBackShoulderWidth',
  );
  const neckCm = getMeasurementCm(measurements, 'neckGirth');
  const neckBaseCm = getMeasurementCm(measurements, 'neckBaseGirth');
  const calfCm = getMeasurementCm(measurements, 'calfGirthR');
  const wristCm = getMeasurementCm(measurements, 'wristGirthR');
  const forearmCm = getMeasurementCm(measurements, 'forearmGirthR');
  const kneeCm = getMeasurementCm(measurements, 'kneeGirthR');

  return {
    heightCm,
    weightKg,
    bmi,
    bodyFatPercentage,
    muscleMassKg,
    waistCm,
    hipCm,
    source,
    metadata: JSON.stringify({
      provider: 'BodyGram',

      scan: {
        scanId: entry?.id ?? null,
        customScanId: entry?.customScanId ?? null,
        status: entry?.status ?? null,
        createdAt: entry?.createdAt ?? null,
        memberId: entry?.memberId ?? null,
      },

      input: {
        gender: input?.gender ?? onboarding?.gender ?? null,
        age: input?.age ?? onboarding?.age ?? null,
        heightRaw: input?.height ?? null,
        weightRaw: input?.weight ?? null,
        heightCm,
        weightKg,
      },

      bodyComposition: {
        bodyFatPercentage,
        skeletalMuscleMassGram:
          entry?.bodyComposition?.skeletalMuscleMass ?? null,
        muscleMassKg,
      },

      extraMeasurements: {
        bustCm,
        underBustCm,
        bicepCm,
        waistCm,
        hipCm,
        thighCm,
        midThighCm,
        shoulderCm,
        neckCm,
        neckBaseCm,
        calfCm,
        wristCm,
        forearmCm,
        kneeCm,
      },

      rawMeasurements: measurements,
    }),
  };
}

export function buildTraineeProfilePayload(
  onboarding: OnboardingData,
  bodyGram?: BodyGramData,
) {
  const payload: Record<string, any> = {};

  if (onboarding.fullName) payload.fullName = onboarding.fullName;
  if (onboarding.age != null) payload.age = onboarding.age;
  if (onboarding.gender) payload.gender = mapGenderToEnum(onboarding.gender);

  if (onboarding.avatarUrl) {
    payload.avatarUrl = onboarding.avatarUrl;
  } else if ((onboarding as any).avatar) {
    payload.avatarUrl = (onboarding as any).avatar;
  }

  if (onboarding.workoutLevel) payload.workoutLevel = onboarding.workoutLevel;

  if (onboarding.workoutFrequency) {
    payload.workoutFrequency = onboarding.workoutFrequency;
  }

  if (bodyGram) {
    if (!payload.fullName && (bodyGram.fullName || bodyGram.name)) {
      payload.fullName = bodyGram.fullName ?? bodyGram.name;
    }

    if (!payload.gender && bodyGram.gender) {
      payload.gender = mapGenderToEnum(bodyGram.gender);
    }

    if (!payload.age && bodyGram.age) {
      payload.age = bodyGram.age;
    }
  }

  const metadata: Record<string, any> = {};

  Object.keys(onboarding || {}).forEach((k) => {
    if (
      ![
        'fullName',
        'age',
        'gender',
        'avatarUrl',
        'avatar',
        'workoutLevel',
        'workoutFrequency',
      ].includes(k)
    ) {
      metadata[k] = (onboarding as any)[k];
    }
  });

  if (bodyGram) {
    const { mapped, extras } = extractAndMap(bodyGram, {});

    Object.keys(mapped).forEach((k) => {
      if (!(k in payload)) {
        metadata[k] = mapped[k];
      }
    });

    Object.assign(metadata, extras);
  }

  if (Object.keys(metadata).length > 0) {
    payload.metadata = JSON.stringify(metadata);
  }

  return payload;
}

export async function createTraineeProfile(
  onboarding: OnboardingData,
  bodyGram?: BodyGramData,
): Promise<ServiceResult> {
  try {
    const payload = buildTraineeProfilePayload(onboarding, bodyGram);
    const res = await api.post('/trainees/profile', payload);
    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

export async function submitTraineeProfile(
  onboarding: OnboardingData,
  bodyGram?: BodyGramData,
): Promise<ServiceResult> {
  try {
    const payload = buildTraineeProfilePayload(onboarding, bodyGram);

    if (!payload || Object.keys(payload).length === 0) {
      return { ok: true, data: { skipped: true } };
    }

    return await createTraineeProfile(onboarding, bodyGram);
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

export async function submitPersonalInjuries(
  onboarding: OnboardingData,
): Promise<ServiceResult> {
  try {
    const injuriesInput =
      (onboarding as any)?.personalInjuries ??
      (onboarding as any)?.injuries ??
      null;

    if (
      !injuriesInput ||
      !Array.isArray(injuriesInput) ||
      injuriesInput.length === 0
    ) {
      return { ok: true, data: [] };
    }

    const promises = injuriesInput.map((inj: any) => {
      const injuryId = inj?.injuryId ?? inj?.id ?? inj?.injury?.id ?? null;
      const notes = inj?.notes ?? inj?.note ?? null;

      if (!injuryId) return Promise.resolve({ skipped: true });

      return createPersonalInjury({
        injuryId: String(injuryId),
        notes,
      });
    });

    const results = await Promise.all(promises);

    const normalized = results.map((r: any) =>
      r?.ok ? r.data : { error: r?.error ?? r },
    );

    return { ok: true, data: normalized };
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

export async function submitHealthProfile(
  payload: HealthProfilePayload,
): Promise<ServiceResult> {
  try {
    if (!payload || Object.keys(payload).length === 0) {
      return {
        ok: true,
        data: {
          skipped: true,
        },
      };
    }

    const res = await api.post('/health-profiles/my-profiles', payload);
    const data = res.data?.data ?? res.data ?? res;

    return {
      ok: true,
      data,
    };
  } catch (e: any) {
    return {
      ok: false,
      error: e.response?.data ?? e.message ?? e,
    };
  }
}

export async function submitProfiles(
  onboarding: OnboardingData,
  bodyGram?: BodyGramData,
  source = 'BodyGram',
  options?: {
    skipCreateTrainee?: boolean;
    forceHealthOnly?: boolean;
  },
): Promise<ServiceResult<{ trainee?: any; health?: any }>> {
  try {
    const results: any = {};
    const skipCreate = options?.skipCreateTrainee ?? false;

    if (!skipCreate) {
      const tRes = await submitTraineeProfile(onboarding, bodyGram);

      if (!tRes.ok) {
        results.trainee = { ok: false, error: tRes.error };
      } else {
        results.trainee = tRes.data;
      }

      const injRes = await submitPersonalInjuries(onboarding);

      if (!injRes.ok) {
        results.personalInjuries = { ok: false, error: injRes.error };
      } else {
        results.personalInjuries = injRes.data;
      }
    }

    if (bodyGram && Object.keys(bodyGram).length > 0) {
      const healthPayload = mapBodygramToHealthProfilePayload({
        bodyGram,
        onboarding,
        source,
      });

      const healthRes = await submitHealthProfile(healthPayload);

      if (!healthRes.ok) {
        return {
          ok: false,
          error: {
            step: 'health',
            error: healthRes.error,
          },
        };
      }

      results.health = healthRes.data;
    }

    return { ok: true, data: results };
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

export async function fetchTraineeProfile(): Promise<ServiceResult> {
  try {
    const res = await api.get('/trainees/profile');
    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;

    return { ok: false, error };
  }
}

export async function updateTraineeProfile(
  payload: Record<string, any>,
): Promise<ServiceResult> {
  try {
    const res = await api.put('/trainees/profile', payload);
    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;

    return { ok: false, error };
  }
}

export async function fetchInjuries(): Promise<ServiceResult> {
  try {
    const res = await api.get('/injuries');
    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;

    return { ok: false, error };
  }
}

export async function createPersonalInjury(payload: {
  injuryId: string;
  notes?: string;
}): Promise<ServiceResult> {
  try {
    const res = await api.post('/personal-injuries', payload);
    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;

    return { ok: false, error };
  }
}

export async function uploadInBodyScan(
  image: {
    uri: string;
    name?: string;
    type?: string;
  },
  rawScanId?: string,
): Promise<ServiceResult> {
  try {
    const fd = new FormData();
    const fileName = image.name ?? `inbody_${Date.now()}.jpg`;

    const fileAny: any = {
      uri: image.uri,
      name: fileName,
      type: image.type ?? 'image/jpeg',
    };

    fd.append('image', fileAny as any);

    if (rawScanId) {
      fd.append('rawScanId', rawScanId);
    }

    const res = await api.post(
      '/health-profiles/my-profiles/inbody-extract',
      fd as any,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    return {
      ok: false,
      error: 'AI đang bận vui lòng thử lại sau',
    };
  }
}

export async function fetchMyHealthProfiles(): Promise<ServiceResult> {
  try {
    const res = await api.get('/health-profiles/my-profiles');
    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;

    return { ok: false, error };
  }
}

export async function fetchHealthProfileById(
  id: string,
): Promise<ServiceResult> {
  try {
    const res = await api.get(`/health-profiles/my-profiles/${id}`);
    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;

    return { ok: false, error };
  }
}

export async function fetchFitnessGoals(): Promise<ServiceResult> {
  try {
    const res = await api.get('/fitness-goals/active');
    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

export async function fetchTraineeHealthProfiles(
  id: string,
): Promise<ServiceResult> {
  try {
    const res = await api.get(
      `/health-profiles/trainee/${id}/latest-with-assessment`,
    );

    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

export async function fetchHealthProfileAssessment(
  id: string,
): Promise<ServiceResult> {
  try {
    const res = await api.get(
      `/health-profile-assessments/my-profiles/${id}`,
    );

    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;

    return { ok: false, error };
  }
}

export async function fetchMyHealthProfileMetrics(): Promise<ServiceResult> {
  try {
    const res = await api.get('/health-profiles/my-profiles/metrics');
    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

export async function fetchMyInjuries(): Promise<ServiceResult> {
  try {
    const res = await api.get('/personal-injuries/my-injuries');
    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

export async function fetchPersonalInjuryById(
  id: string,
): Promise<ServiceResult> {
  try {
    const res = await api.get(`/personal-injuries/${id}`);
    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

export async function updatePersonalInjury(
  id: string,
  payload: {
    status?: string;
    notes?: string;
  },
): Promise<ServiceResult> {
  try {
    const res = await api.put(`/personal-injuries/${id}`, payload);
    const data = res.data?.data ?? res.data ?? res;

    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;

    return { ok: false, error };
  }
}