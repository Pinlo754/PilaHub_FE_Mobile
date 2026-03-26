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
import { Measurements } from '../screens/BodyGram/types/measurement';
import BodyScanFlowScreen from '../screens/BodyGram/screens/BodyScanFlowScreen';
import ResultScreen from '../screens/BodyGram/screens/ResultScreen';
import BodyGramResult from '../screens/BodyGram/screens/BodyGramResult';
import BodyMetricDetails from '../screens/BodyGram/screens/BodyMetricDetails';
import PlanScreen from '../screens/Plan/PlanScreen';
import UpgradePlanScreen from '../screens/Plan/UpgradePlanScreen';
import RegisterScreen from '../screens/Register/RegisterScreen';
import OtpScreen from '../screens/Register/OtpScreen';
import StartupScreen from '../screens/StartupScreen';
import CreateRoadmapScreen from '../screens/Plan/CreateRoadmapScreen';
import PlanDetailScreen from '../screens/Plan/PlanDetailScreen';
import SchedulePlayer from '../screens/Plan/SchedulePlayer';

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
import VideoCall from '../screens/VideoCall/VideoCall';
import { NavigatorScreenParams } from '@react-navigation/native';
import { PracticePayload } from '../utils/CourseLessonProgressType';
import TraineeProfileScreen from '../screens/Profile/TraineeProfileScreen';
import HealthProfilesScreen from '../screens/Profile/HealthProfilesScreen';
import HealthProfileAssessmentScreen from '../screens/Profile/HealthProfileAssessmentScreen';
import CoachProfileScreen from '../screens/Coach/Profile/CoachProfile';
import TraineeProfileCoachScreen from '../screens/Coach/TraineeProfile/TraineeProfileCoach';
import UploadImageScreen from '../screens/UploadImage/UploadImage';
import SendRequestScreen from '../screens/RegisterCoachRoadmap/SendRequest';
import ListRequest from '../screens/Coach/ViewRequest/ListRequest';
import TraineeHealthProfileResult from '../screens/Coach/ViewRequest/HealthProfileResult';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import ResetPasswordConfirmScreen from '../screens/Auth/ResetPasswordConfirmScreen';
import WalletScreen from '../screens/Wallet/WalletScreen';
import TransactionDetailScreen from '../screens/Wallet/TransactionDetailScreen';
import DepositWebViewScreen from '../screens/Wallet/DepositWebViewScreen';
import DepositResultScreen from '../screens/Wallet/DepositResultScreen';
import DeviceScanScreen from '../screens/IoT/DeviceScanScreen';
import MyDevicesScreen from '../screens/IoT/MyDevicesScreen';
import { BleProvider } from '../services/BleProvider';
import { CartProvider } from '../context/CartContext';
import TraineeBooking from '../screens/TraineeBooking/TraineeBooking';
import ProductDetailScreen from '../screens/Shop/ProductDetailScreen';
import CartScreen from '../screens/Shop/CartScreen';
import CheckoutScreen from '../screens/Shop/CheckoutScreen';
import AddressListScreen from '../screens/Shop/AddressListScreen';
import AddressFormScreen from '../screens/Shop/AddressFormScreen';
import OrdersScreen from '../screens/Profile/OrdersScreen';
import RoadmapProductsScreen from '../screens/Shop/RoadmapProductsScreen';
import InputBodyScreen from '../screens/BodyGram/screens/InputBodyScreen';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  Home: undefined;
  Login: undefined;
  Welcome: undefined;
  Onboarding: undefined;
  Startup: undefined;
  Search: undefined;
  SearchResult: { q?: string; showFilter?: boolean } | undefined;
  ShopSearchResult: { q?: string } | undefined;
  Checkout: undefined;
  AddressList: undefined;
  AddressForm: { onSaved?: () => void } | undefined;
  TraineeProfile: undefined;
  Orders: undefined;
  OrderDetail: { orderId: string };
  Roadmap: undefined;
  RoadmapSummary: undefined;
  Plan: { addedRoadmap?: { roadmap: any; stages: any[] } } | undefined;
  RoadMap: { addedRoadmap?: { roadmap: any; stages: any[] } } | undefined;
  PlanDetail: { roadmap?: any; stages?: any[] } | undefined;
  CreateRoadmap: undefined;
  RoadmapProducts: undefined;
  UpgradePlan: undefined;
  ExerciseDetail: { exercise_id: string };
  ProductDetail: { productId: string };
  Cart: undefined;
  InputBody: undefined;
  BodyScanFlow: undefined;
  Result: { measurements: Measurements; avatar?: string; rawResponse?: any };
  BodyGramResult:
    | { measurements: Measurements; avatar?: string; rawResponse?: any }
    | undefined;
  BodyMetricDetails: undefined;
  Register: undefined;
  VerifyEmail: { email: string; password?: string };
  ResetPasswordConfirm: { email?: string } | undefined;
  ProgramDetail: {
    program_id: string;
    traineeCourseId?: string;
    traineeId?: string;
  };
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
  HealthProfileAssessment: { healthProfileId: string } | undefined;

  CoachDetail: {
    coachId: string;
    selectedCoachId?: string | null;
    pricePerHour: number;
  };
  List: undefined;
  DailyTask: undefined;
  RegisterCalendar:
    | { coach_id?: string | null; pricePerHour?: number }
    | undefined;
  TraineeFeedback: { liveSessionId?: string } | undefined;
  TraineeReport:
    | { coach_id?: string | null; exercise_id?: string | null }
    | undefined;
  AISummary:
    | {
        feedback: any;
        videoUrl: string;
        mistakeLog: any;
        heartRateLogs?: { heartRate: number; recordedAt: number }[];
      }
    | undefined;

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
  VideoCall: { bookingId: string };
  UploadImageScreen: undefined;
  SendRequestScreen: { coach_id: string; pricePerHour: number | undefined };
  ListRequest: undefined;
  TraineeHealthProfileResult:
    | { measurements: Measurements; avatar?: string; rawResponse?: any }
    | undefined;
  ForgotPassword: undefined;
  Wallet: { transactionId?: string } | undefined;
  DepositWebView:
    | { paymentUrl: string; transactionId?: string; orderCode?: string }
    | undefined;
  DepositResult: { success: boolean; data?: any } | undefined;
  Deposit: undefined;
  Withdraw: undefined;
  TransactionDetail: { transactionId: string } | undefined;
  DeviceScan: undefined;
  MyDevices: undefined;
  TraineeBooking: undefined;
  SchedulePlayer:
    | {
        queue: { ex: any; videoSrc?: string | null }[];
        startIndex?: number;
        scheduleId?: string;
        title?: string;
      }
    | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <BleProvider>
      <CartProvider>
        <AppLayout>
          <Stack.Navigator
            initialRouteName="Startup"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Startup" component={StartupScreen} />
            <Stack.Screen
              name="InputBody"
              component={InputBodyScreen}
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
              name="BodyMetricDetails"
              component={BodyMetricDetails}
            />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyEmail" component={OtpScreen} />
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
            <Stack.Screen
              name="ResetPasswordConfirm"
              component={ResetPasswordConfirmScreen}
            />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen
              name="SearchResult"
              component={require('../screens/Search/SearchResult').default}
            />
            <Stack.Screen
              name="ShopSearchResult"
              component={require('../screens/Shop/ShopSearchResult').default}
            />
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetail} />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
            />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen
              name="RoadmapProducts"
              component={RoadmapProductsScreen}
            />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="AddressList" component={AddressListScreen} />
            <Stack.Screen name="AddressForm" component={AddressFormScreen} />
            <Stack.Screen name="Roadmap" component={RoadmapScreen} />
            <Stack.Screen name="RoadmapSummary" component={RoadmapSummary} />
            <Stack.Screen
              name="CreateRoadmap"
              component={CreateRoadmapScreen}
            />
            <Stack.Screen
              name="TraineeProfile"
              component={TraineeProfileScreen}
            />
            <Stack.Screen
              name="HealthProfiles"
              component={HealthProfilesScreen}
            />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen
              name="OrderDetail"
              component={
                require('../screens/Profile/OrderDetailScreen').default
              }
            />
            <Stack.Screen name="Plan" component={PlanScreen} />
              <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
            <Stack.Screen name="SchedulePlayer" component={SchedulePlayer} />
            <Stack.Screen name="UpgradePlan" component={UpgradePlanScreen} />
            <Stack.Screen name="DeviceScan" component={DeviceScanScreen} />
            <Stack.Screen name="MyDevices" component={MyDevicesScreen} />

            <Stack.Screen
              name="TestNavigateScreen"
              component={TestNavigateScreen}
            />
            <Stack.Screen name="CoachScreen" component={CoachScreen} />

            <Stack.Screen
              name="CoachRegisterSchedule"
              component={CoachRegisterSchedule}
            />
            <Stack.Screen
              name="TraineeListScreen"
              component={TraineeListScreen}
            />
            <Stack.Screen
              name="CommingsoonClass"
              component={CommingsoonClass}
            />
            <Stack.Screen
              name="EndSessionScreen"
              component={EndSessionScreen}
            />
            <Stack.Screen name="FeedbackScreen" component={FeedbackScreen} />
            <Stack.Screen name="ProgramDetail" component={ProgramDetail} />
            <Stack.Screen name="CoachDetail" component={CoachDetail} />
            <Stack.Screen name="List" component={ListScreen} />
            <Stack.Screen name="DailyTask" component={DailyTask} />
            <Stack.Screen
              name="RegisterCalendar"
              component={RegisterCalendar}
            />
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
            <Stack.Screen
              name="UploadImageScreen"
              component={UploadImageScreen}
            />
            <Stack.Screen
              name="SendRequestScreen"
              component={SendRequestScreen}
            />
            <Stack.Screen name="ListRequest" component={ListRequest} />
            <Stack.Screen
              name="TraineeHealthProfileResult"
              component={TraineeHealthProfileResult}
            />
            <Stack.Screen
              name="HealthProfileAssessment"
              component={HealthProfileAssessmentScreen}
            />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen
              name="Deposit"
              component={require('../screens/Wallet/DepositScreen').default}
            />
            <Stack.Screen
              name="Withdraw"
              component={require('../screens/Wallet/WithdrawScreen').default}
            />
            <Stack.Screen
              name="DepositWebView"
              component={DepositWebViewScreen}
            />
            <Stack.Screen
              name="DepositResult"
              component={DepositResultScreen}
            />
            <Stack.Screen
              name="TransactionDetail"
              component={TransactionDetailScreen}
            />
            <Stack.Screen name="TraineeBooking" component={TraineeBooking} />
          </Stack.Navigator>
        </AppLayout>
      </CartProvider>
    </BleProvider>
  );
};

export default AppNavigator;
