
import React, {  useEffect } from 'react'
import GenderUI from './steps/gender/Gender.ui'
import { useOnboardingStore } from '../../store/onboarding.store'
import { loadOnboarding, saveOnboarding } from '../../utils/storage'
import { SafeAreaView } from 'react-native-safe-area-context'
import AgeUI from './steps/age/Age.ui'
import WeightUI from './steps/weight/Weight.ui'
import HeightUI from './steps/height/Height.ui'
import InformationUI from './steps/infor/Information.ui'
import TargetUI from './steps/target/Target.ui'
const STEPS = [
  GenderUI,
  AgeUI,
  WeightUI,
  HeightUI,
  InformationUI,
  TargetUI
]

const OnboardingScreen = () => {
  const {step, data, setStep, setData} = useOnboardingStore();
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
    saveOnboarding({step, data});
  }, [step, data]);
  console.log('OnboardingScreen: ', data);

  return (
  <SafeAreaView className='flex-1 bg-background justify-center items-center px-6'>
    <StepComponent />
  </SafeAreaView>
  )
}

export default OnboardingScreen