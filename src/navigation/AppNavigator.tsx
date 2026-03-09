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
import BodyGramResult from '../screens/BodyGram/screens/BodyGramResult';
import InputBodyScreen from '../screens/BodyGram/screens/InputBodyScreen';
import PlanScreen from '../screens/Plan/PlanScreen';
import UpgradePlanScreen from '../screens/Plan/UpgradePlanScreen';
import RegisterScreen from '../screens/Register/RegisterScreen';
import OtpScreen from '../screens/Register/OtpScreen';
import StartupScreen from '../screens/StartupScreen';
import CreateRoadmapScreen from '../screens/Plan/CreateRoadmapScreen';
import PlanDetailScreen from '../screens/Plan/PlanDetailScreen';

import CoachScreen from '../screens/Coach/CoachScreen';
import CoachRegisterSchedule from '../screens/Coach/Schedule/CoachRegisterSchedule';
import CommingsoonClass from '../screens/Coach/CommingsoonClass/CommingsoonClass';
import EndSessionScreen from '../screens/Coach/EndSessionCoach/EndSessionScreen';
import FeedbackScreen from '../screens/Coach/Feedback/FeedbackScreen';
import TraineeListScreen from '../screens/Coach/TraineeList/TraineeListScreen';
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
import TraineeProfileScreen from '../screens/Profile/TraineeProfileScreen';
import HealthProfilesScreen from '../screens/Profile/HealthProfilesScreen';
import RoadMap from '../screens/Plan/RoadMap';

import AITracking from '../screens/AITracking/AITracking';
import CoachProfileScreen from '../screens/Coach/Profile/CoachProfile';
import TraineeProfileCoachScreen from '../screens/Coach/TraineeProfile/TraineeProfileCoach';
import VideoCall from '../screens/VideoCall/VideoCall';
import UploadImageScreen from '../screens/UploadImage/UploadImage';
export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  Login: undefined;
  Welcome: undefined;
  Onboarding: undefined;
  Startup: undefined;
  Search: undefined;
  Roadmap: undefined;
  RoadmapSummary: undefined;
  Plan: { addedRoadmap?: { roadmap: any; stages: any[] } } | undefined;
  RoadMap: { addedRoadmap?: { roadmap: any; stages: any[] } } | undefined;
  PlanDetail: { roadmap?: any; stages?: any[] } | undefined;
  CreateRoadmap: undefined;
  UpgradePlan: undefined;
  ExerciseDetail: { exercise_id: string };
  ManualInput: undefined;
  BodyScanFlow: undefined;
  Result: { measurements: Measurements; avatar?: string; rawResponse?: any };
  BodyGramResult: { measurements: Measurements; avatar?: string; rawResponse?: any } | undefined;
  InputBody: undefined;
  Register: undefined;
  VerifyEmail: { email: string; password?: string };
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
  HealthProfiles: undefined;


  CoachDetail: { coach_id: string; selectedCoachId?: string | null };
  List: undefined;
  DailyTask: undefined;
  RegisterCalendar: { coach_id?: string | null };
  TraineeFeedback: undefined;
  TraineeReport: { coach_id?: string | null; exercise_id?: string | null };
  AISummary: {
  videoUrl: string;
  mistakeLog: any; 
};
  AIPractice: {
    exercise_id: string;
    imgUrl: string;
    videoUrl: string;
    workoutSessionId: string;
  };
  AITracking: {
    workoutSessionId: string;
    onFeedback: (data: { status: string; detail: string }) => void;
  };
  CoachProfileScreen: undefined;
  TraineeProfileCoachScreen: undefined;
  VideoCall: undefined;
  UploadImageScreen: undefined;
  TraineeProfile: undefined;
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
        <Stack.Screen name="Startup" component={StartupScreen} />
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
          name="BodyGramResult"
          component={BodyGramResult}
          options={{ title: 'Kết quả Bodygram' }}
        />
        <Stack.Screen
          name="InputBody"
          component={InputBodyScreen}
          options={{ title: 'Nhập thông tin cơ thể' }}
        />
        <Stack.Screen name="Register" component={RegisterScreen} />
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
        <Stack.Screen name="CreateRoadmap" component={CreateRoadmapScreen} />
        <Stack.Screen name="TraineeProfile" component={TraineeProfileScreen} />
        <Stack.Screen name="HealthProfiles" component={HealthProfilesScreen} />
        <Stack.Screen name="Plan" component={PlanScreen} />
        <Stack.Screen name="RoadMap" component={RoadMap} />
        <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
        <Stack.Screen name="UpgradePlan" component={UpgradePlanScreen} />
        <Stack.Screen
          name="TestNavigateScreen"
          component={TestNavigateScreen}
        />
        <Stack.Screen name="CoachScreen" component={CoachScreen} />
        <Stack.Screen
          name="CoachRegisterSchedule"
          component={CoachRegisterSchedule}
        />
        <Stack.Screen name="TraineeListScreen" component={TraineeListScreen} />
        <Stack.Screen name="CommingsoonClass" component={CommingsoonClass} />
        <Stack.Screen name="EndSessionScreen" component={EndSessionScreen} />
        <Stack.Screen name="FeedbackScreen" component={FeedbackScreen} />
        <Stack.Screen name="ProgramDetail" component={ProgramDetail} />
        <Stack.Screen name="CoachDetail" component={CoachDetail} />
        <Stack.Screen name="List" component={ListScreen} />
        <Stack.Screen name="DailyTask" component={DailyTask} />
        <Stack.Screen name="RegisterCalendar" component={RegisterCalendar} />
        <Stack.Screen name="TraineeFeedback" component={TraineeFeedback} />
        <Stack.Screen name="TraineeReport" component={TraineeReport} />
        <Stack.Screen name="AISummary" component={AISummary} />
        <Stack.Screen name="AIPractice" component={AIPractice} />
        <Stack.Screen
          name="CoachProfileScreen"
          component={CoachProfileScreen}
        />
        <Stack.Screen
          name="TraineeProfileCoachScreen"
          component={TraineeProfileCoachScreen}
        />
        <Stack.Screen name="VideoCall" component={VideoCall} />
        <Stack.Screen name="UploadImageScreen" component={UploadImageScreen} />
      </Stack.Navigator>
    </AppLayout>
  );
};

export default AppNavigator;
