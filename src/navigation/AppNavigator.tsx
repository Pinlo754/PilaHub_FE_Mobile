import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/Home/HomeScreen';
import LoginScreen from '../screens/Login/LoginScreen';
import AppLayout from '../components/AppLayout';
import WelcomeScreen from '../screens/Welcome/WelcomeScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import ExerciseDetail from '../screens/ExerciseDetail/ExerciseDetail';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Welcome: undefined;
  Onboarding: undefined;
  Search: undefined;
  ExerciseDetail: { exercise_id: string };
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
