import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Camera, useCameraDevices, CameraPermissionStatus } from 'react-native-vision-camera';
import BodySilhouetteOverlay from './BodySilhouetteOverlay';

type Props = {
  onCapture: (photoPath: string) => void;
  mode: 'front' | 'side';
};

export default function BodyScanCamera({ onCapture, mode }: Props) {
  const devices = useCameraDevices();
  const [useFront, setUseFront] = useState(true); // MẶC ĐỊNH CAMERA TRƯỚC
  const device = devices.find(d => d.position === (useFront ? 'front' : 'back'));

  const cameraRef = useRef<Camera>(null);
  const [permission, setPermission] = useState<CameraPermissionStatus>('not-determined');
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setPermission(status);
    })();
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });
      onCapture(photo.path);
    } catch (e) {
      console.log('Capture error', e);
    } finally {
      setIsCapturing(false);
    }
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

      {/* NÚT CHỤP ẢNH */}
      <View className="absolute bottom-10 w-full items-center">
        <Pressable
          onPress={handleCapture}
          className={`w-16 h-16 rounded-full border-4 border-white items-center justify-center ${
            isCapturing ? 'bg-white/40' : 'bg-white'
          }`}
        />
        <Text className="text-white mt-3">
          Nhấn để chụp ảnh {mode === 'front' ? 'mặt trước' : 'bên hông'}
        </Text>
      </View>

      {/* SWITCH CAMERA BUTTON */}
      <Pressable
        onPress={() => setUseFront(prev => !prev)}
        className="absolute top-10 right-6 bg-white/20 px-3 py-1 rounded-xl"
      >
        <Text className="text-white text-sm">
          {useFront ? 'Switch to Back' : 'Switch to Front'}
        </Text>
      </Pressable>
    </View>
  );
}
