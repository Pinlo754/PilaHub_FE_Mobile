import React, { useMemo, useState } from 'react';
import { Text, ScrollView, View, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MeasurementPanel from '../components/MeasurementPanel';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { WebView } from 'react-native-webview';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route }: Props) {
  // route.params may contain measurements and optional avatar (base64 OBJ string)
  const { measurements, avatar, rawResponse } = route.params as any;

  const [showRaw, setShowRaw] = useState(false);

  const avatarHtml = useMemo(() => {
    if (!avatar) return '';

    // Safely stringify base64 so it can be embedded in HTML
    const avatarB64 = JSON.stringify(avatar);

    // Simple three.js UMD + OBJLoader approach
    return `
      <!doctype html>
      <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
        <style>html,body{margin:0;height:100%;overflow:hidden;background:#ffffff}#canvas{width:100%;height:100%}</style>
      </head>
      <body>
        <div id="canvas"></div>
        <script src="https://unpkg.com/three@0.154.0/build/three.min.js"></script>
        <script src="https://unpkg.com/three@0.154.0/examples/js/loaders/OBJLoader.js"></script>
        <script>
          (function(){
            try{
              const b64 = ${avatarB64};
              const objText = atob(b64);
              const container = document.getElementById('canvas');
              const width = container.clientWidth || window.innerWidth;
              const height = container.clientHeight || window.innerHeight;

              const scene = new THREE.Scene();
              const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100);
              camera.position.set(0, 1.4, 1.8);

              const renderer = new THREE.WebGLRenderer({ antialias: true });
              renderer.setSize(width, height);
              container.appendChild(renderer.domElement);

              const ambient = new THREE.AmbientLight(0xcccccc, 0.8);
              scene.add(ambient);
              const dir = new THREE.DirectionalLight(0xffffff, 0.6);
              dir.position.set(1, 1, 1);
              scene.add(dir);

              const loader = new THREE.OBJLoader();
              const group = loader.parse(objText);
              scene.add(group);

              // center & scale
              const box = new THREE.Box3().setFromObject(group);
              const size = new THREE.Vector3();
              box.getSize(size);
              const maxDim = Math.max(size.x, size.y, size.z);
              const scale = 1.0 / maxDim * 1.2;
              group.scale.set(scale, scale, scale);
              box.setFromObject(group);
              const center = new THREE.Vector3();
              box.getCenter(center);
              group.position.sub(center);

              function animate(){
                requestAnimationFrame(animate);
                group.rotation.y += 0.005;
                renderer.render(scene, camera);
              }
              animate();

              // notify React Native that render succeeded
              try { if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'avatar-render', ok: true })); } catch(e){}

              // handle resize
              window.addEventListener('resize', function(){
                const w = container.clientWidth || window.innerWidth;
                const h = container.clientHeight || window.innerHeight;
                renderer.setSize(w, h);
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
              });
            }catch(e){
              try { if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'avatar-render', ok: false, error: String(e) })); } catch(err){}
              document.body.innerHTML = '<div style="padding:20px;font-family:sans-serif">Could not render avatar</div>';
            }
          })();
        </script>
      </body>
      </html>
    `;
  }, [avatar]);

  // prepare safe stringified raw response for debug view
  let rawJson = '';
  try {
    rawJson = rawResponse ? JSON.stringify(rawResponse, null, 2) : '';
  } catch {
    rawJson = 'Could not stringify response';
  }

  if (avatar && !showRaw) {
    return (
      <View className="flex-1 bg-slate-50">
        <Text className="text-xl font-extrabold text-center my-3">3D Avatar</Text>
        <View className="h-64 mx-3 rounded-lg overflow-hidden">
          <WebView
            originWhitelist={["*"]}
            source={{ html: avatarHtml }}
            className="flex-1"
            javaScriptEnabled={true}
            allowUniversalAccessFromFileURLs={true}
            mixedContentMode="always"
            onMessage={(e) => {
              try { console.log('WebView message:', e.nativeEvent.data); } catch {};
            }}
            startInLoadingState={true}
          />
        </View>
        <ScrollView className="flex-1 p-3">
          <Text className="text-lg font-extrabold mb-2">Kết quả số đo</Text>
          <MeasurementPanel data={measurements} />

          {/* debug button to show raw JSON */}
          {rawJson ? (
            <View className="mt-3">
              <Button title="Xem raw response" onPress={() => setShowRaw(true)} />
            </View>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  if (showRaw) {
    return (
      <View className="flex-1 p-3 bg-white">
        <Button title="Quay lại" onPress={() => setShowRaw(false)} />
        <ScrollView className="mt-3">
          <Text className="text-xs">{rawJson || 'No response available'}</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4 bg-slate-50">
      <Text className="text-2xl font-bold mb-4">Kết quả số đo cơ thể</Text>
      <MeasurementPanel data={measurements} />

      {/* debug button to show raw JSON when no avatar present */}
      {rawJson ? (
        <View className="mt-3">
          <Button title="Xem raw response" onPress={() => setShowRaw(true)} />
        </View>
      ) : null}
    </ScrollView>
  );
}
