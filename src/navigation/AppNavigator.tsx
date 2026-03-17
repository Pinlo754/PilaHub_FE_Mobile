import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/Home/HomeScreen';
import LoginScreen from '../screens/Login/LoginScreen';
import AppLayout from '../components/AppLayout';
import WelcomeScreen from '../screens/Welcome/WelcomeScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import SearchScreen from '../screens/Search/SearchScreen';
import ExerciseDetail from '../screens/ExerciseDetail/ExerciseDetail';
import TabNavigator, { RootTabParamList } from './TabNavigator';
import RoadmapScreen from '../screens/Roadmap/RoadmapScreen';
import RoadmapSummary from '../screens/RoadmapSummary/RoadmapSummary';
import ProgramDetail from '../screens/ProgramDetail/ProgramDetail';
import CoachDetail from '../screens/CoachDetail/CoachDetail';
import ListScreen from '../screens/List/ListScreen';
import DailyTask from '../screens/DailyTask/DailyTask';
import RegisterCalendar from '../screens/RegisterCalendar/RegisterCalendar';
import TraineeFeedback from '../screens/TraineeFeedback/TraineeFeedback';
import TraineeReport from '../screens/TraineeReport/TraineeReport';
import AISummary from '../screens/AISummary/AISummary';
import TestNavigateScreen from './testNavigate';
import AIPractice from '../screens/AIPractice/AIPractice';
import TraineeBooking from '../screens/TraineeBooking/TraineeBooking';
import VideoCall from '../screens/VideoCall/VideoCall';
import { NavigatorScreenParams } from '@react-navigation/native';
import { PracticePayload } from '../utils/CourseLessonProgressType';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  Home: undefined;
  Login: undefined;
  Welcome: undefined;
  Onboarding: undefined;
  Search: undefined;
  ExerciseDetail: {
    exercise_id: string;
    allowedPractice?: boolean;
    practicePayload?: PracticePayload;
  };
  Roadmap: undefined;
  RoadmapSummary: undefined;
  ProgramDetail: { program_id: string; traineeCourseId?: string };
  CoachDetail: { coach_id: string; selectedCoachId?: string | null };
  List: undefined;
  DailyTask: undefined;
  RegisterCalendar: { coach_id?: string | null; pricePerHour?: number };
  TraineeFeedback: { liveSessionId?: string };
  TraineeReport: {
    coach_id?: string | null;
    exercise_id?: string | null;
    liveSessionId?: string | null;
  };
  AISummary: undefined;
  AIPractice: {
    exercise_id: string;
    imgUrl: string;
    videoUrl: string;
    workoutSessionId: string;
  };
  TraineeBooking: undefined;
  VideoCall: { bookingId: string };
  TestNavigateScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <AppLayout>
      <Stack.Navigator
        initialRouteName="Login"
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
        <Stack.Screen name="AISummary" component={AISummary} />
        <Stack.Screen name="AIPractice" component={AIPractice} />
        <Stack.Screen name="TraineeBooking" component={TraineeBooking} />
        <Stack.Screen name="VideoCall" component={VideoCall} />
        <Stack.Screen
          name="TestNavigateScreen"
          component={TestNavigateScreen}
        />
      </Stack.Navigator>
    </AppLayout>
  );
};

export default AppNavigator;
