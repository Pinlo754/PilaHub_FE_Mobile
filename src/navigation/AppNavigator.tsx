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
import CoachDetail from '../screens/CoachDetail/CoachDetail';
import ListScreen from '../screens/List/ListScreen';
import DailyTask from '../screens/DailyTask/DailyTask';
import RegisterCalendar from '../screens/RegisterCalendar/RegisterCalendar';
import TraineeFeedback from '../screens/TraineeFeedback/TraineeFeedback';
import TraineeReport from '../screens/TraineeReport/TraineeReport';

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
  CoachDetail: { coach_id: string; selectedCoachId?: string | null };
  List: undefined;
  DailyTask: undefined;
  RegisterCalendar: { coach_id?: string | null };
  TraineeFeedback: undefined;
  TraineeReport: { coach_id?: string | null; exercise_id?: string | null };
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
        <Stack.Screen name="CoachDetail" component={CoachDetail} />
        <Stack.Screen name="List" component={ListScreen} />
        <Stack.Screen name="DailyTask" component={DailyTask} />
        <Stack.Screen name="RegisterCalendar" component={RegisterCalendar} />
        <Stack.Screen name="TraineeFeedback" component={TraineeFeedback} />
        <Stack.Screen name="TraineeReport" component={TraineeReport} />
      </Stack.Navigator>
    </AppLayout>
  );
};

export default AppNavigator;
