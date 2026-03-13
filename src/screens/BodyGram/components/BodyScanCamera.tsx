import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Camera, useCameraDevice, CameraPermissionStatus } from 'react-native-vision-camera';
import BodySilhouetteOverlay from './BodySilhouetteOverlay';

type Props = {
  onCapture: (photoPath: string) => void;
  mode: 'front' | 'side';
};

export default function BodyScanCamera({ onCapture, mode }: Props) {
  
  // default to back camera for full-body shots
  const [useFront, setUseFront] = useState(false);
  // support both shapes: devices can be array or object with front/back
  const device = useCameraDevice(useFront ? 'front' : 'back');

  const cameraRef = useRef<Camera>(null);
  const [permission, setPermission] = useState<CameraPermissionStatus>('not-determined');
  const [isCapturing, setIsCapturing] = useState(false);

  // countdown state
  const [countdown, setCountdown] = useState<number>(0);
  const intervalRef = useRef<any>(null);
  
  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setPermission(status);
    })();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const doTakePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      onCapture(photo.path);
    } catch (e) {
      console.log('Capture error', e);
    } finally {
      setIsCapturing(false);
    }
  };

  const startCountdownAndCapture = () => {
    if (isCapturing) return;

    // if a countdown is already running, cancel it
    if (countdown > 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCountdown(0);
      return;
    }

    // start 5s countdown
    setCountdown(5);
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          // stop interval and take photo
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setCountdown(0);
          // small delay to let UI update
          setTimeout(() => {
            doTakePhoto();
          }, 150);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  if (!device || permission !== 'granted') {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Đang chuẩn bị camera...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* OVERLAY HƯỚNG DẪN */}
      <BodySilhouetteOverlay mode={mode} />

      {/* HƯỚNG DẪN POSE */}
      <View className="absolute top-10 w-full items-center">
        <Text className="text-white text-lg font-semibold mt-6">
          {mode === 'front'
            ? 'Đứng thẳng, nhìn vào camera'
            : 'Đứng nghiêng 90°, tay thả tự nhiên'}
        </Text>
        <Text className="text-white/80 mt-1 text-sm">
          Canh người trong khung trắng
        </Text>
      </View>

      {/* NÚT CHỤP ẢNH + SWAP */}
      <View className="absolute bottom-10 w-full items-center">
        <View className="flex-row items-center space-x-4">
          {/* flip button placed next to capture */}
          <Pressable
            onPress={() => setUseFront((p) => !p)}
            className="bg-white/20 px-3 py-2 rounded-xl"
            disabled={isCapturing || countdown > 0}
          >
            <Text className="text-white">🔁</Text>
          </Pressable>

          {/* capture button */}
          <Pressable
            onPress={startCountdownAndCapture}
            className={`w-16 h-16 rounded-full border-4 border-white items-center justify-center ${isCapturing ? 'bg-white/40' : 'bg-white'}`}
          >
            {countdown > 0 ? (
              <Text className="text-black text-xl font-bold">{countdown}</Text>
            ) : null}
          </Pressable>

          {/* spacer for symmetry */}
          <View style={{ width: 44 }} />
        </View>

        <Text className="text-white mt-3">
          {countdown > 0 ? `Tự động chụp sau ${countdown}s` : `Nhấn để chụp ảnh ${mode === 'front' ? 'mặt trước' : 'bên hông'}`}
        </Text>
      </View>
    </View>
  );
}
