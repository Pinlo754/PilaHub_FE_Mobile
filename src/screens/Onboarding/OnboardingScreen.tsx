import React, {  useEffect } from 'react'
import GenderUI from './steps/gender/Gender.ui'
import { useOnboardingStore } from '../../store/onboarding.store'
import { loadOnboarding, saveOnboarding, clearOnboarding } from '../../utils/storage'
import { SafeAreaView } from 'react-native-safe-area-context'
import AgeUI from './steps/age/Age.ui'
import WeightUI from './steps/weight/Weight.ui'
import HeightUI from './steps/height/Height.ui'
import WorkoutUI from './steps/workout/Workout.ui'
import { useNavigation } from '@react-navigation/native';
import InjuryUI from './steps/injury/Injury.ui'
import InformationUI from './steps/infor/Information.ui'
const STEPS = [
  GenderUI,
  AgeUI,
  WeightUI,
  HeightUI,
  InformationUI,
  WorkoutUI,
  InjuryUI,
  // Target step removed — goal selection moved to CreateRoadmap
]

const OnboardingScreen = () => {
  const {step, data, setStep, setData, reset} = useOnboardingStore();
  const navigation = useNavigation<any>();
  const StepComponent = STEPS[step];

  useEffect(() => {
    loadOnboarding().then((saved) => {
      if (saved) {
        setData(saved.data);
        setStep(saved.step ?? 0);
      }
    });
  }, [setData,setStep]);

  useEffect(() => {
    // if step index is out of range (e.g. user advanced past last step), finish onboarding
    if (step >= STEPS.length) {
      // ensure persisted onboarding cleared so next time a new user starts fresh
      try { clearOnboarding(); } catch {}
      // navigate into BodyGram flow (InputBody) after finishing onboarding
      navigation.replace('InputBody' as any);
      return;
    }
    saveOnboarding({step, data});
  }, [step, data, navigation]);

  useEffect(() => {
    // if this component mounts and there's no step saved, ensure we start at step 0
    if (step == null) {
      reset();
    }
  }, [reset, step]);

  if (!StepComponent) {
    // avoid rendering undefined component
    return null;
  }

  return (
  <SafeAreaView className='flex-1 bg-background justify-center items-center px-6'>
    <StepComponent />
  </SafeAreaView>
  )
}

export default OnboardingScreen