import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/Home/HomeScreen';
import LoginScreen from '../screens/Login/LoginScreen';
import AppLayout from '../components/AppLayout';
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
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
    </Stack.Navigator>
  );
};

export default AppNavigator;
