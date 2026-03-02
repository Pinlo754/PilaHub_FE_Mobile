import { OnboardingData } from '../../../store/onboarding.store';

export function normalizeForBodygram(data: OnboardingData) {
  // required core fields
  const required = ['age', 'gender', 'height', 'weight'];
  const missing: string[] = [];

  for (const k of required) {
    const v = (data as any)[k];
    if (v === undefined || v === null || v === '') {
      missing.push(k);
    }
  }

  if (missing.length > 0) {
    // Vietnamese-friendly error that BodyScanFlow will surface to the user
    throw new Error(`Thiếu thông tin: ${missing.join(', ')}. Vui lòng hoàn tất onboarding.`);
  }

  // Coerce and validate numeric values
  const age = Number((data.age as any));
  if (isNaN(age) || age <= 0) throw new Error('Giá trị age không hợp lệ');

  const gender = data.gender;
  if (gender !== 'male' && gender !== 'female') throw new Error('Giá trị gender không hợp lệ');

  const heightVal = Number((data.height as any));
  if (isNaN(heightVal) || heightVal <= 0) throw new Error('Giá trị height không hợp lệ');

  const hUnit = (data.heightUnit || 'cm').toString().toLowerCase();
  let heightMm: number;
  if (hUnit === 'cm') {
    heightMm = heightVal * 10;
  } else if (hUnit === 'mm') {
    heightMm = heightVal;
  } else if (hUnit === 'm') {
    heightMm = heightVal * 1000;
  } else {
    console.warn('Unknown heightUnit', data.heightUnit, '— assuming cm');
    heightMm = heightVal * 10;
  }

  const weightVal = Number((data.weight as any));
  if (isNaN(weightVal) || weightVal <= 0) throw new Error('Giá trị weight không hợp lệ');

  const wUnit = (data.weightUnit || 'kg').toString().toLowerCase();
  let weightGram: number;
  if (wUnit === 'kg') {
    weightGram = weightVal * 1000;
  } else if (wUnit === 'g' || wUnit === 'gram') {
    weightGram = weightVal;
  } else if (wUnit === 'lb' || wUnit === 'lbs') {
    weightGram = weightVal * 453.59237;
  } else {
    console.warn('Unknown weightUnit', data.weightUnit, '— assuming kg');
    weightGram = weightVal * 1000;
  }

  return {
    age: Math.round(age),
    gender,
    height: Math.round(heightMm),
    weight: Math.round(weightGram),
  };
}
