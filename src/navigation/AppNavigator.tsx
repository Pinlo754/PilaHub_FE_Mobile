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
import ProgramDetail from '../screens/ProgramDetail/ProgramDetail';
import TestNavigateScreen from './testNavigate';
import CoachScreen from '../screens/Coach/CoachScreen';
import CoachRegisterSchedule from '../screens/Coach/Schedule/CoachRegisterSchedule';
import CommingsoonClass from '../screens/Coach/CommingsoonClass/CommingsoonClass';
import EndSessionScreen from '../screens/Coach/EndSessionCoach/EndSessionScreen';
import FeedbackScreen from '../screens/Coach/Feedback/FeedbackScreen';
import TraineeListScreen from '../screens/Coach/TraineeList/TraineeListScreen';
export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  Login: undefined;
  Welcome: undefined;
  Onboarding: undefined;
  Search: undefined;
  ExerciseDetail: { exercise_id: string };
  Roadmap: undefined;
  RoadmapSummary: undefined;
  ProgramDetail: { program_id: string };
  TestNavigateScreen: undefined;
  CoachScreen: undefined;
  CoachRegisterSchedule: undefined;
  TraineeListScreen: undefined;
  RequestList: undefined;
  Messages: undefined;
  Courses: undefined;
  Settings: undefined;
  CommingsoonClass: {
    selectedId: string;
  };
  EndSessionScreen: {
    selectedId: string;
  };
  FeedbackScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <AppLayout>
      <Stack.Navigator
        initialRouteName="TestNavigateScreen"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetail} />
        <Stack.Screen name="Roadmap" component={RoadmapScreen} />
        <Stack.Screen name="RoadmapSummary" component={RoadmapSummary} />
        <Stack.Screen name="ProgramDetail" component={ProgramDetail} />
        <Stack.Screen name="TestNavigateScreen" component={TestNavigateScreen} />
        <Stack.Screen name="CoachScreen" component={CoachScreen} />
        <Stack.Screen name="CoachRegisterSchedule" component={CoachRegisterSchedule} />
        <Stack.Screen name="TraineeListScreen" component={TraineeListScreen} />
        <Stack.Screen name="CommingsoonClass" component={CommingsoonClass} />
        <Stack.Screen name="EndSessionScreen" component={EndSessionScreen} />
        <Stack.Screen name="FeedbackScreen" component={FeedbackScreen} />
     </Stack.Navigator>
    </AppLayout>
  );
};

export default AppNavigator;
