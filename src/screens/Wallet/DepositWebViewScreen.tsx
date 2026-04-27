import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fetchMyWallet } from '../../services/wallet';
import api from '../../hooks/axiosInstance';

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
    const [k, v = ''] = pair.split('=');

    if (k) {
      const key = decodeURIComponent(k.replace(/\+/g, ' '));
      const value = decodeURIComponent(v.replace(/\+/g, ' '));
      q[key] = value;
    }
  });

  return q;
}, []);
  const handleCallbackData = useCallback(async (payload: any) => {
    // normalize possible shapes
    const params = payload?.params ?? payload ?? {};
    // Try to call backend callback endpoint so server processes the deposit (IPN may not reach local dev)
    let backendSuccess = false;
    try {
      // backend endpoint is unauthenticated for VNPay callback (/api/wallet/deposit/callback)
      const resp = await api.get('/wallet/deposit/callback', { params });
      const rspCode = resp?.data?.RspCode ?? resp?.data?.RspCode ?? resp?.data?.RspCode;
      backendSuccess = rspCode === '00' || rspCode === '0' || String(rspCode).toLowerCase() === 'success';
    } catch (e) {
      console.warn('[DepositWebView] backend callback error', e);
    }

    const code = params.vnp_ResponseCode ?? params.vnp_TransactionStatus ?? params.RspCode ?? params.rspCode ?? params.respCode ?? params.respCode;
    const clientHasCode = typeof code !== 'undefined' && code !== null && String(code).length > 0;
    const clientSuccess = code === '00' || code === '0' || String(code).toLowerCase() === 'success';
    // If client provided a responseCode, treat it as authoritative: non-'00' => failure.
    const success = clientHasCode ? clientSuccess : (backendSuccess || clientSuccess);

    // For debugging: log results
    console.log('[DepositWebView] VNPay callback received:', { params, success, transactionId, orderCode });

    try {
      const res = await fetchMyWallet();
      if (res.ok) console.log('[DepositWebView] Wallet after deposit:', res.data);
    } catch {
      // ignore
    }

    // Navigate to result screen with backend result if available
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

    const lowerUrl = String(url).toLowerCase();
    // detect explicit cancel/fail keywords in redirect URLs
    if (lowerUrl.includes('cancel') || lowerUrl.includes('paymentfailed') || lowerUrl.includes('payment_failure') || lowerUrl.includes('vnp_transactionstatus=cancel')) {
      try {
        const params = parseQuery(url);
        // navigate to fail result
        navigation.navigate('DepositResult', { success: false, transactionId, orderCode, params });
      } catch (e) {
        navigation.navigate('DepositResult', { success: false });
      }
      return;
    }

    // Fallback: if URL has query params from VNPay or MoMo
    // VNPay uses vnp_ResponseCode / vnp_TransactionStatus
    // MoMo/IPN redirects often include resultCode / errorCode / orderId / requestId / message
    if (url.includes('vnp_ResponseCode=') || url.includes('vnp_TransactionStatus=') || url.includes('resultCode=') || url.includes('errorCode=') || url.includes('orderId=') || url.includes('requestId=') || url.includes('message=')) {
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
          const lower = String(url).toLowerCase();
          if (lower.includes('cancel') || lower.includes('paymentfailed') || lower.includes('vnp_transactionstatus=cancel')) {
            const params = parseQuery(url);
            try {
              navigation.navigate('DepositResult', { success: false, transactionId, orderCode, params });
            } catch {}
            return false;
          }

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
