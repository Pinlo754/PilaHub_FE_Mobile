import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/Home/HomeScreen';
import LoginScreen from '../screens/Login/LoginScreen';
import AppLayout from '../components/AppLayout';
import WelcomeScreen from '../screens/Welcome/WelcomeScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import ExerciseDetail from '../screens/ExerciseDetail/ExerciseDetail';
import MethodSelectScreen from '../screens/BodyGram/screens/MethodSelectScreen';
import ManualInputScreen from '../screens/BodyGram/screens/ManualInputScreen';
import BodyScanFlowScreen from '../screens/BodyGram/screens/BodyScanFlowScreen';
import ResultScreen from '../screens/BodyGram/screens/ResultScreen';
import { Measurements } from '../screens/BodyGram/types/measurement';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Welcome: undefined;
  Onboarding: undefined;
  Search: undefined;
  ExerciseDetail: { exercise_id: string };
  MethodSelect: undefined;
  ManualInput: undefined;
  BodyScanFlow: undefined;
  Result: { measurements: Measurements; avatar?: string; rawResponse?: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
return (
  <AppLayout>
    <Stack.Navigator
      initialRouteName="Search"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
          name="MethodSelect"
          component={MethodSelectScreen}
          options={{ title: 'Body Measurements' }}
        />
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
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetail} />
      
    </Stack.Navigator>
  </AppLayout>
);
};

export default AppNavigator;
