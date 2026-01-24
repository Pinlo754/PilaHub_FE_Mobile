import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/Home/HomeScreen';
import LoginScreen from '../screens/Login/LoginScreen';
import AppLayout from '../components/AppLayout';
import SearchScreen from '../screens/Search/SearchScreen';
import ExerciseDetail from '../screens/ExerciseDetail/ExerciseDetail';
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Search: undefined;
  ExerciseDetail: { exercise_id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Search"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home">
        {props => (
          <AppLayout>
            <HomeScreen {...props} />
          </AppLayout>
        )}
      </Stack.Screen>

      <Stack.Screen name="Login">
        {props => (
          <AppLayout>
            <LoginScreen {...props} />
          </AppLayout>
        )}
      </Stack.Screen>

      <Stack.Screen name="Search">
        {props => (
          <AppLayout>
            <SearchScreen {...props} />
          </AppLayout>
        )}
      </Stack.Screen>

      <Stack.Screen name="ExerciseDetail">
        {props => (
          <AppLayout>
            <ExerciseDetail {...props} />
          </AppLayout>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default AppNavigator;
