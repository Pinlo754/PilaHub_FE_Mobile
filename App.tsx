import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import messaging from '@react-native-firebase/messaging';
try {
  // Use fast-text-encoding which works in RN
  // npm install fast-text-encoding
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder, TextDecoder } = require('fast-text-encoding');
  if (typeof (global as any).TextEncoder === 'undefined') (global as any).TextEncoder = TextEncoder;
  if (typeof (global as any).TextDecoder === 'undefined') (global as any).TextDecoder = TextDecoder;
} catch (e) {
  // ignore if polyfill not installed
}
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
