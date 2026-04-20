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
    // treat common "height estimate" variants as raw height values
    if (
      lowered === 'height_est' ||
      lowered === 'height-est' ||
      lowered.includes('height_est') ||
      lowered.includes('heightestimate') ||
      lowered.includes('height_estimate') ||
      lowered.includes('height_estimated')
    ) {
      // map to a generic height value; the health payload builder will normalize to cm
      result.height = v;
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
  // support both 'avatarUrl' and older 'avatar' key used by onboarding store
  if (onboarding.avatarUrl) payload.avatarUrl = onboarding.avatarUrl;
  else if ((onboarding as any).avatar) payload.avatarUrl = (onboarding as any).avatar;
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
  // exclude avatar (alias) from metadata because we map it to avatarUrl above
  Object.keys(onboarding || {}).forEach((k) => {
    if (!['fullName', 'age', 'gender', 'avatarUrl', 'avatar', 'workoutLevel', 'workoutFrequency'].includes(k)) {
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
    // recognize common height-estimate keys
    height_est: 'height',
    'height-est': 'height',
    heightestimate: 'height',
    height_estimate: 'height',
    height_estimated: 'height',
  };

  const { mapped, extras } = extractAndMap(bodyGram, mapping);

  // try multiple places for height/weight when missing
  let heightRaw = mapped.heightCm ?? mapped.height;
  let weightRaw = mapped.weightKg ?? mapped.weight;

  // If bodyGram contains a stringified metadata JSON (common when merging payloads), parse it so we can search inside
  const searchTarget: any = { ...(bodyGram || {}) };
  if (typeof bodyGram?.metadata === 'string') {
    try {
      searchTarget.metadata = JSON.parse(bodyGram.metadata);
    } catch {
      // ignore parse errors
    }
  }

  // Fallback: scan top-level keys for common height-est variants (e.g., height_est)
  if (heightRaw == null && bodyGram) {
    for (const k of Object.keys(bodyGram)) {
      const kl = k.toLowerCase();
      if (kl === 'height' || kl === 'heightcm' || /height(_|-)?est|heightestimate|height_estimate|height_estimated/.test(kl)) {
        heightRaw = bodyGram[k];
        break;
      }
    }
  }

  if (heightRaw == null) {
    heightRaw = findNumericInPaths(searchTarget, [
      ['height'],
      ['heightCm'],
      ['input', 'photoScan', 'height'],
      ['input', 'height'],
      ['metadata', 'height'],
      ['metadata', 'heightCm'],
      ['bodyComposition', 'height'],
    ]);
  }

  // Similar fallback for weight
  if (weightRaw == null && bodyGram) {
    for (const k of Object.keys(bodyGram)) {
      const kl = k.toLowerCase();
      if (kl === 'weight' || kl === 'weightkg' || /weight(_|-)?est|weightestimate|weight_estimate|weightkg/.test(kl)) {
        weightRaw = bodyGram[k];
        break;
      }
    }
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
         // log full error for debugging
         try { console.log('createTraineeProfile full error:', JSON.stringify(errObj, null, 2)); } catch { /* ignore */ }
         const isInternal = (errObj && (errObj.errorCode === 'INTERNAL_SERVER_ERROR' || errObj.message?.toLowerCase?.().includes('internal')));
         if (isInternal) {
           try {
             const minimal: any = {};
             if (onboarding.fullName) minimal.fullName = onboarding.fullName;
             if (onboarding.age != null) minimal.age = onboarding.age;
             if (onboarding.gender) minimal.gender = mapGenderToEnum(onboarding.gender);
             if (onboarding.workoutFrequency) minimal.workoutFrequency = onboarding.workoutFrequency;
             if (onboarding.workoutLevel) minimal.workoutLevel = onboarding.workoutLevel;
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
            // If the server responded with validation errors, attempt a targeted minimal retry
            const errCode = errObj?.errorCode ?? '';
            const isValidation = errCode === 'VALIDATION_ERROR' || String(errObj?.message ?? '').toLowerCase().includes('validation');
            if (isValidation) {
              try {
                const minimal2: any = {};
                if (onboarding.fullName) minimal2.fullName = onboarding.fullName;
                if (onboarding.email) minimal2.email = onboarding.email;
                if (onboarding.age != null) minimal2.age = onboarding.age;
                if (onboarding.gender) minimal2.gender = mapGenderToEnum(onboarding.gender);
                if (onboarding.workoutFrequency) minimal2.workoutFrequency = onboarding.workoutFrequency;
                if (onboarding.workoutLevel) minimal2.workoutLevel = onboarding.workoutLevel;
                 // if we have at least one field to send, try retry
                 if (Object.keys(minimal2).length === 0) {
                   return { ok: false, error: { step: 'trainee', error: t.error } };
                 }
                 console.warn('Retrying createTraineeProfile with validation-aware minimal payload', minimal2);
                 const retry = await createTraineeProfile(minimal2 as any, undefined);
                 if (retry.ok) {
                   results.trainee = retry.data;
                 } else {
                   return { ok: false, error: { step: 'trainee', error: t.error, retry: retry.error } };
                 }
               } catch (e: any) {
                 return { ok: false, error: { step: 'trainee', error: t.error, retryThrown: e } };
               }
             } else {
               return { ok: false, error: { step: 'trainee', error: t.error } };
             }
           }
         }
       } else {
         results.trainee = t.data;
       }

       // AFTER trainee creation (or skip), attach personal injuries if provided in onboarding
       try {
         const injuriesInput = (onboarding as any)?.personalInjuries ?? (onboarding as any)?.injuries ?? null;
         if (injuriesInput && Array.isArray(injuriesInput) && injuriesInput.length > 0) {
           const injuryResults: any[] = [];
           for (const inj of injuriesInput) {
             // normalize to { injuryId, notes }
             const injuryId = inj?.injuryId ?? inj?.id ?? inj?.injuryId ?? inj?.injury?.id ?? null;
             const notes = inj?.notes ?? inj?.note ?? null;
             if (!injuryId) continue;
             try {
               const p = await createPersonalInjury({ injuryId, notes });
               if (p.ok) injuryResults.push(p.data ?? p.data?.data ?? p.data);
               else injuryResults.push({ error: p.error });
             } catch (e) {
               injuryResults.push({ error: e });
             }
           }
           results.personalInjuries = injuryResults;
         }
       } catch (e) {
         console.warn('Failed to attach personal injuries after trainee creation', e);
       }
     }

     // create health profile from bodyGram
     if (bodyGram && Object.keys(bodyGram).length > 0) {
       // merge onboarding-provided height/weight into bodyGram when missing so normalization can pick them up
       const mergedBodyGram: BodyGramData = { ...bodyGram };
       if (onboarding) {
         // copy straightforward numeric fields
         if ((onboarding as any).weight != null && mergedBodyGram.weight == null && mergedBodyGram.weightKg == null) {
           mergedBodyGram.weight = (onboarding as any).weight;
         }
         if ((onboarding as any).weightKg != null && mergedBodyGram.weightKg == null) {
           mergedBodyGram.weightKg = (onboarding as any).weightKg;
         }
         if ((onboarding as any).height != null && mergedBodyGram.height == null && mergedBodyGram.heightCm == null) {
           mergedBodyGram.height = (onboarding as any).height;
         }
         if ((onboarding as any).heightCm != null && mergedBodyGram.heightCm == null) {
           mergedBodyGram.heightCm = (onboarding as any).heightCm;
         }

         // if onboarding carries a metadata JSON string (common), try to parse and extract
         const md = (onboarding as any).metadata;
         if (md) {
           if (typeof md === 'string') {
             try {
               const parsed = JSON.parse(md);
               if (parsed) {
                 if (mergedBodyGram.height == null && parsed.height != null) mergedBodyGram.height = parsed.height;
                 if (mergedBodyGram.heightCm == null && (parsed.heightCm != null || parsed.height_cm != null)) mergedBodyGram.heightCm = parsed.heightCm ?? parsed.height_cm;
                 if (mergedBodyGram.weight == null && parsed.weight != null) mergedBodyGram.weight = parsed.weight;
                 if (mergedBodyGram.weightKg == null && (parsed.weightKg != null || parsed.weight_kg != null)) mergedBodyGram.weightKg = parsed.weightKg ?? parsed.weight_kg;
               }
             } catch {
               // ignore parse errors
             }
           } else if (typeof md === 'object') {
             if (mergedBodyGram.height == null && md.height != null) mergedBodyGram.height = md.height;
             if (mergedBodyGram.heightCm == null && (md.heightCm != null || md.height_cm != null)) mergedBodyGram.heightCm = md.heightCm ?? md.height_cm;
             if (mergedBodyGram.weight == null && md.weight != null) mergedBodyGram.weight = md.weight;
             if (mergedBodyGram.weightKg == null && (md.weightKg != null || md.weight_kg != null)) mergedBodyGram.weightKg = md.weightKg ?? md.weight_kg;
           }
         }
       }

      // Build health payload to see if normalization yields height/weight; skip API call if missing
      const healthPayload = buildHealthProfilePayload(mergedBodyGram, source);
      if (healthPayload.heightCm == null || healthPayload.weightKg == null) {
        console.warn('Skipping health profile creation due to missing normalized height/weight (merged with onboarding)', {
          heightCm: healthPayload.heightCm,
          weightKg: healthPayload.weightKg,
          sampleOnboardingKeys: Object.keys(onboarding || {}).slice(0, 20),
          sampleBodyGramKeys: Object.keys(bodyGram || {}).slice(0, 20),
        });
        results.health = { skipped: true, reason: 'missing_height_or_weight', payload: healthPayload } as any;
      } else {
        const h = await createHealthProfile(mergedBodyGram, source);
        if (!h.ok) return { ok: false, error: { step: 'health', error: h.error } };
        results.health = h.data;
      }
     }

     return { ok: true, data: results };
   } catch (e: any) {
     return { ok: false, error: e.response?.data ?? e.message ?? e };
   }
 }

// Fetch trainee profile for current authenticated account
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
 
 // Update trainee profile for authenticated account (PUT)
 export async function updateTraineeProfile(payload: Record<string, any>): Promise<ServiceResult> {
  try {
    const res = await api.put('/trainees/profile', payload);
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;
    return { ok: false, error };
  }
}

// Fetch injuries library
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

// Create personal injury for trainee
export async function createPersonalInjury(payload: { injuryId: string; notes?: string }): Promise<ServiceResult> {
  try {
    const res = await api.post('/personal-injuries', payload);
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;
    return { ok: false, error };
  }
}

// Fetch health profiles for the authenticated trainee (returns array or empty)
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

// Fetch a specific health profile by id for the authenticated trainee
export async function fetchHealthProfileById(id: string): Promise<ServiceResult> {
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

export async function fetchTraineeHealthProfiles(id: string): Promise<ServiceResult> {
  try {
    const res = await api.get(`/health-profiles/trainee/${id}/latest-with-assessment`);
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

// Retrieve AI-generated assessment for a specific health profile (trainee-owned)
export async function fetchHealthProfileAssessment(id: string): Promise<ServiceResult> {
  try {
    const res = await api.get(`/health-profile-assessments/my-profiles/${id}`);
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;
    return { ok: false, error };
  }
}

// Fetch health profile metrics for the authenticated trainee (for charts/comparisons)
export async function fetchMyHealthProfileMetrics(): Promise<ServiceResult> {
   try {
     const res = await api.get('/health-profiles/my-profiles/metrics');
     const data = res.data?.data ?? res.data ?? res;
     return { ok: true, data };
   } catch (e: any) {
     return { ok: false, error: e.response?.data ?? e.message ?? e };
   }
}

// Fetch personal injuries for authenticated trainee
export async function fetchMyInjuries(): Promise<ServiceResult> {
  try {
    const res = await api.get('/personal-injuries/my-injuries');
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

// Fetch a single personal injury by id
export async function fetchPersonalInjuryById(id: string): Promise<ServiceResult> {
  try {
    const res = await api.get(`/personal-injuries/${id}`);
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e.response?.data ?? e.message ?? e };
  }
}

// Update a personal injury (status, notes)
export async function updatePersonalInjury(id: string, payload: { status?: string; notes?: string }): Promise<ServiceResult> {
  try {
    const res = await api.put(`/personal-injuries/${id}`, payload);
    const data = res.data?.data ?? res.data ?? res;
    return { ok: true, data };
  } catch (e: any) {
    const error = e.response?.data ?? e.message ?? e;
    return { ok: false, error };
  }
}
