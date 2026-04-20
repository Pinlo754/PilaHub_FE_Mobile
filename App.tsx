import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import messaging from '@react-native-firebase/messaging';
import { Linking } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';


const navigationRef = createNavigationContainerRef();

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
    // --- BƯỚC 2: XIN QUYỀN (Android 13+ và iOS) ---
    const requestUserPermission = async () => {
      await notifee.requestPermission();
    };

    // --- BƯỚC 3: XỬ LÝ KHI APP ĐANG MỞ (Foreground) ---
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Nhận thông báo ở Foreground:', remoteMessage);

      // Tạo Channel cho Android (Bắt buộc)
      const channelId = await notifee.createChannel({
        id: 'important_channel',
        name: 'Thông báo quan trọng',
        importance: AndroidImportance.HIGH, // HIGH để hiện popup (Heads-up)
      });

      // Hiển thị thông báo bằng Notifee
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || "Thông báo mới",
        body: remoteMessage.notification?.body || "",
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
        },
      });
    });

    requestUserPermission();
    return unsubscribe;
  }, []);

  // Add deep-link debug listener: log initial URL and incoming url events
  useEffect(() => {
    const handleUrl = (event: { url?: string }) => {
      console.log('[Linking] event raw:', event);
      const url = event?.url ?? '';
      console.log('[Linking] event url:', url);
      try {
        const qIdx = url.indexOf('?');
        const qs = qIdx === -1 ? '' : url.slice(qIdx + 1).split('#')[0];
        const params: Record<string, string> = {};
        qs.split('&').forEach(p => { const [k, v = ''] = p.split('='); if (k) params[decodeURIComponent(k)] = decodeURIComponent(v); });
        console.log('[Linking] parsed params:', params);

        // If MoMo redirect contains orderId -> go to MomoResult screen to poll/check status
        if (params.orderId) {
          if (navigationRef.isReady()) {
            (navigationRef as any).navigate('MomoResult', { orderId: params.orderId });
            return;
          }
        }

        // If generic result code exists, navigate to DepositResult
        if (params.resultCode) {
          const ok = params.resultCode === '0' || params.resultCode === '00';
          if (navigationRef.isReady()) (navigationRef as any).navigate('DepositResult', { success: ok, data: params });
        }
      } catch (e) {
        console.warn('[Linking] parse error', e);
      }
    };

    Linking.getInitialURL()
      .then(url => {
        if (url) handleUrl({ url });
      })
      .catch(err => console.warn('[Linking] getInitialURL error', err));

    // subscribe (supports newer RN subscription API)
    const sub: any = (Linking as any).addEventListener ? (Linking as any).addEventListener('url', handleUrl) : null;

    return () => {
      try {
        sub && sub.remove();
      } catch {
        // fallback for older RN
        try { (Linking as any).removeEventListener && (Linking as any).removeEventListener('url', handleUrl); } catch { }
      }
    };
  }, []);

  // Deep linking configuration: custom scheme + optional https host
  const linking = {
    prefixes: ['pilahub://', 'https://pilahub.com'],
    config: {
      screens: {
        // maps pilahub://deposit-result?success=true to DepositResult screen
        MomoResult: 'deposit-result',
        // optional: map webview entry if you want
        DepositWebView: 'deposit',
        // add other mappings here as needed
      },
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
