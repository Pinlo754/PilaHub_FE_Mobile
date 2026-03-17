import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fetchMyWallet } from '../../services/wallet';

export default function DepositWebViewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { paymentUrl, transactionId, orderCode } = route.params ?? {};
  const [loading, setLoading] = useState(true);

  const parseQuery = useCallback((url: string) => {
    const q: Record<string, string> = {};
    const idx = url.indexOf('?');
    if (idx === -1) return q;
    const qs = url.slice(idx + 1).split('#')[0];
    qs.split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      if (k) q[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return q;
  }, []);

  const handleCallbackData = useCallback(async (payload: any) => {
    // normalize possible shapes
    const params = payload?.params ?? payload ?? {};
    const code = params.vnp_ResponseCode ?? params.vnp_TransactionStatus ?? params.RspCode ?? params.rspCode ?? params.respCode ?? params.respCode;
    const success = code === '00' || code === '0' || String(code).toLowerCase() === 'success';

    // For debugging: log results
    console.log('[DepositWebView] VNPay callback received:', { params, success, transactionId, orderCode });

    if (success) {
      try {
        const res = await fetchMyWallet();
        if (res.ok) console.log('[DepositWebView] Wallet after deposit:', res.data);
      } catch {
        // ignore errors while logging
      }
    }

    // Navigate to a dedicated result screen so user sees explicit result (success or failure)
    // small delay so logs appear in console before navigation
    setTimeout(() => {
      try {
        navigation.navigate('DepositResult', { success, transactionId, orderCode, params });
      } catch {}
    }, 400);

    // NOTE: we intentionally keep WebView open until we navigate back above.
  }, [navigation, transactionId, orderCode]);

  const onNavStateChange = useCallback((navState: any) => {
    const { url } = navState;
    if (!url) return;

    // Fallback: if URL has query params from VNPay
    if (url.includes('vnp_ResponseCode=') || url.includes('vnp_TransactionStatus=')) {
      const params = parseQuery(url);
      handleCallbackData(params);
    }
  }, [parseQuery, handleCallbackData]);

  // Inject JS to post the page body back to RN. The backend callback may render raw JSON in body.
  const injectedJS = `(function(){
    try{
      const bodyText = (document && document.body && (document.body.innerText || document.body.textContent)) || '';
      // send only when body contains JSON-like content
      if (bodyText && (bodyText.trim().startsWith('{') || bodyText.trim().startsWith('['))) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pageBody', body: bodyText }));
      }
    } catch{}
  })(); true;`;

  const onMessage = useCallback((event: any) => {
    const { nativeEvent } = event;
    if (!nativeEvent || !nativeEvent.data) return;

    try {
      const msg = JSON.parse(nativeEvent.data);
      if (msg?.type === 'pageBody' && msg.body) {
        try {
          const parsed = JSON.parse(msg.body);
          handleCallbackData(parsed);
        } catch {}
      }
    } catch {}
  }, [handleCallbackData]);

  if (!paymentUrl) {
    Alert.alert('Lỗi', 'Không tìm thấy URL thanh toán');
    navigation.goBack();
    return null;
  }

  return (
    <View style={styles.container}>
      {loading && (
        <ActivityIndicator style={StyleSheet.absoluteFill} size="large" />
      )}

      <WebView
        source={{ uri: paymentUrl }}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(navState) => {
          console.log('[DepositWebView] navState URL:', navState?.url);
          onNavStateChange(navState);
        }}
        // Intercept navigation requests so we can handle VNPay callback before WebView loads any external error page
        onShouldStartLoadWithRequest={(request) => {
          const url = request?.url || '';
          console.log('[DepositWebView] shouldStartLoad:', url);
          if (url.includes('vnp_ResponseCode=') || url.includes('vnp_TransactionStatus=')) {
            const params = parseQuery(url);
            handleCallbackData(params);
            // prevent WebView from navigating to the callback URL (avoids showing error page)
            return false;
          }
          return true;
        }}
        onError={(e) => {
          console.warn('[DepositWebView] webview error', e.nativeEvent);
          try {
            Alert.alert('Lỗi', 'Không thể tải trang thanh toán. Vui lòng thử lại.');
          } catch {}
        }}
        onHttpError={(e) => {
          console.warn('[DepositWebView] http error', e.nativeEvent);
        }}
        injectedJavaScript={injectedJS}
        onMessage={onMessage}
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
