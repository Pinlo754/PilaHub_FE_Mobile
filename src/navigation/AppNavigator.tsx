import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/Home/HomeScreen';
import LoginScreen from '../screens/Login/LoginScreen';
import AppLayout from '../components/AppLayout';
import WelcomeScreen from '../screens/Welcome/WelcomeScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import ExerciseDetail from '../screens/ExerciseDetail/ExerciseDetail';
import TabNavigator from './TabNavigator';
import RoadmapScreen from '../screens/Roadmap/RoadmapScreen';
import RoadmapSummary from '../screens/RoadmapSummary/RoadmapSummary';
import { Measurements } from '../screens/BodyGram/types/measurement';
import ManualInputScreen from '../screens/BodyGram/screens/ManualInputScreen';
import BodyScanFlowScreen from '../screens/BodyGram/screens/BodyScanFlowScreen';
import ResultScreen from '../screens/BodyGram/screens/ResultScreen';
import InputBodyScreen from '../screens/BodyGram/screens/InputBodyScreen';
import PlanScreen from '../screens/Plan/PlanScreen';
import UpgradePlanScreen from '../screens/Plan/UpgradePlanScreen';
import RegisterScreen from '../screens/Register/RegisterScreen';
import OtpScreen from '../screens/Register/OtpScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  Login: undefined;
  Welcome: undefined;
  Onboarding: undefined;
  Search: undefined;
  Roadmap: undefined;
  RoadmapSummary: undefined;
  Plan: undefined;
  UpgradePlan: undefined;
  ExerciseDetail: { exercise_id: string };
  ManualInput: undefined;
  BodyScanFlow: undefined;
  Result: { measurements: Measurements; avatar?: string; rawResponse?: any };
  InputBody: undefined;
  Register: undefined;
  VerifyEmail: { email: string; password?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <AppLayout>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="ManualInput"
          component={ManualInputScreen}
          options={{ title: 'Nhập số đo' }}
        />
        <Stack.Screen
          name="BodyScanFlow"
          component={BodyScanFlowScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: 'Kết quả' }}
        />
        <Stack.Screen
          name="InputBody"
          component={InputBodyScreen}
          options={{ title: 'Nhập thông tin cơ thể' }}
        />
        <Stack.Screen name ="Register" component={RegisterScreen} />
        <Stack.Screen name="VerifyEmail" component={OtpScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetail} />
        <Stack.Screen name="Roadmap" component={RoadmapScreen} />
        <Stack.Screen name="RoadmapSummary" component={RoadmapSummary} />
         <Stack.Screen name="Plan" component={PlanScreen} />
      <Stack.Screen name="UpgradePlan" component={UpgradePlanScreen} />
      </Stack.Navigator>
    </AppLayout>
  );
};

export default AppNavigator;
