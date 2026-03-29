import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import messaging from '@react-native-firebase/messaging';
const App: React.FC = () => {
  console.log('App component rendered');

  useEffect(() => {

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Notification received:', remoteMessage);
    });

    return unsubscribe;

  }, []);
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
