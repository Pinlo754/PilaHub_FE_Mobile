import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RNMediapipe } from '@thinksys/react-native-mediapipe';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { LABELS, SCALER_MEAN, SCALER_SCALE } from '../../hooks/poseModel';
import { useSoundManager } from './useSoundManager';
import {
  useGlobalRecording,
  requestMicrophonePermission,
  startGlobalRecording,
  stopGlobalRecording,
} from 'react-native-nitro-screen-recorder';
import storage from '@react-native-firebase/storage';
import { workoutSessionService } from '../../hooks/workoutSession.service';
import { mistakeLogService } from '../../hooks/mistakeLog.service';
import { CreateMistakeReq, MistakeLogReq } from '../../utils/MistakeLogType';

import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from "../../navigation/AppNavigator";
type Props = {
  workoutSessionId: string;
  onFeedback: (data: { status: string; detail: string }) => void;
};

export default function AITracking({ workoutSessionId, onFeedback }: Props) {
  type RouteProps = RouteProp<RootStackParamList, 'VideoCall'>;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const plugin = useTensorflowModel(
    require('../../assets/pose_correction_exercise_aware.tflite'),
  );
  const model = plugin.model;

  const { loadSounds, play } = useSoundManager();

  const { isRecording } = useGlobalRecording({
    onRecordingStarted: () => {
      console.log('🎬 Global Recording Started');
      sessionStartTime.current = Date.now();
      setIsSessionActive(true);
    },
    onRecordingFinished: file => {
      if (file) {
        console.log('🎥 File saved:', file.path);
        Alert.alert(
          'Recording Complete',
          `Duration: ${file.duration}s\nSize: ${file.size} bytes`,
        );
      }
    },
  });

  const isProcessing = useRef(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const sessionStartTime = useRef<number>(0);
  const [mistakeLogs, setMistakeLogs] = useState<any[]>([]);
  const [showCamera, setShowCamera] = useState(true);
  const uploadVideoToFirebase = async (filePath: string) => {
    try {
      const filename = `videos/${Date.now()}.mp4`;

      const reference = storage().ref(filename);

      const task = reference.putFile(filePath);

      task.on('state_changed', taskSnapshot => {
        const percent =
          (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
        console.log('Upload progress:', percent.toFixed(0) + '%');
      });

      await task;

      const downloadURL = await reference.getDownloadURL();

      console.log('🔥 VIDEO URL:', downloadURL);

      return downloadURL;
    } catch (error) {
      console.error('Upload video error:', error);
      throw error;
    }
  };
  /* ===========================
       🎥 START GLOBAL RECORDING
    ============================ */
  const handleStartSession = async () => {
    try {
      setMistakeLogs([]);

      startGlobalRecording({
        onRecordingError: err => {
          Alert.alert('Recording error', err.message);
        },
      });

      setIsSessionActive(true);
    } catch (e) {
      console.error(e);
    }
  };

  /* ===========================
       🛑 STOP GLOBAL RECORDING
    ============================ */
  const handleEndSession = async () => {
    try {
      const file = await stopGlobalRecording({
        settledTimeMs: 1000,
      });

      if (!file?.path) {
        Alert.alert('Error', 'No video file found');
        return;
      }

      // 🔥 Upload lên Firebase
      const downloadURL = await uploadVideoToFirebase(file.path);
      console.log('Video uploaded. URL:', downloadURL);
      console.log('Mistake logs:', mistakeLogs);
      // 👉 Gửi URL về backend
      // await fetch('https://your-backend-api.com/upload-session', {
      //     method: 'POST',
      //     headers: {
      //         'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //         videoUrl: downloadURL,
      //         mistakes: mistakeLogs,
      //     }),
      // });

      // await workoutSessionService.endWorkout(workoutSessionId, downloadURL);

      // const transformedMistakeLogs: MistakeLogReq[] = mistakeLogs.map(
      //   ({ bodyPart, recordedAtSecond }) => ({
      //     bodyPartId: bodyPart,
      //     details: 'Form error detected',
      //     imageUrl: 'https://example.com/mistake.jpg',
      //     recordedAtSecond,
      //   }),
      // );

      // const payload: CreateMistakeReq = {
      //   workoutSessionId,
      //   mistakeLogs: transformedMistakeLogs,
      // };

      // await mistakeLogService.createMistakeLog(payload);

      setIsSessionActive(false);
      setShowCamera(false);
      navigation.navigate('AISummary', {
        videoUrl: downloadURL,
        mistakeLog: mistakeLogs,
      });
    } catch (e) {
      console.error(e);
    }
  };

  /* ===========================
       🧠 AI INFERENCE
    ============================ */
  const handlePose = useCallback(
    async (data: any) => {
      if (!isSessionActive) return;

      if (!data?.landmarks || !model) return;
      if (isProcessing.current) return;

      try {
        isProcessing.current = true;

        const posePoints = data.landmarks;
        if (posePoints.length < 33) return;

        const kpArray = new Float32Array(132);

        for (let i = 0; i < 33; i++) {
          const lm = posePoints[i];
          const base = i * 4;

          const raw = [lm.x ?? 0, lm.y ?? 0, lm.z ?? 0, lm.visibility ?? 0];

          for (let j = 0; j < 4; j++) {
            const mean = SCALER_MEAN[base + j] ?? 0;
            const scale = SCALER_SCALE[base + j] ?? 1;
            kpArray[base + j] = (raw[j] - mean) / (scale || 1);
          }
        }

        const exArray = new Float32Array(8).fill(0);
        const exIdx = LABELS.exercises.indexOf('shoulder_bridge_single_leg');
        if (exIdx !== -1) exArray[exIdx] = 1;

        const outputs = await model.run([exArray, kpArray]);
        const bodyPartOutput = outputs[0] as Float32Array;
        const labelOutput = outputs[1] as Float32Array;
        const sideOutput = outputs[2] as Float32Array;
        const covertNametoId = (name: string) => {
          if (name === 'Spine Stretch Forward')
            return '02721a7d-9a25-4712-8048-d99043d4fb38';
          return '';
        };
        const incorrectProb = labelOutput[0];

        if (incorrectProb < 0.2) {
          onFeedback({
            status: '✅ CHUẨN',
            detail: `Tư thế chính xác`,
          });
        } else {
          const argMax = (arr: Float32Array) =>
            arr.reduce((best, val, idx) => (val > arr[best] ? idx : best), 0);

          const partIdx = argMax(bodyPartOutput);
          const sideIdx = argMax(sideOutput);

          const secondsFromStart =
            (Date.now() - sessionStartTime.current) / 1000;

          const mistake = {
            bodyPart: LABELS.body_parts[partIdx],
            side: LABELS.sides[sideIdx],
            recordedAtSecond: secondsFromStart,
          };

          setMistakeLogs(prev => [...prev, mistake]);

          play(LABELS.body_parts[partIdx].toLowerCase().replace(' ', ''));

          onFeedback({
            status: '❌ CẦN SỬA',
            detail: `${mistake.bodyPart} (${mistake.side})`,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        isProcessing.current = false;
      }
    },
    [model, isSessionActive],
  );

  const handlePoseRef = useRef(handlePose);

  useEffect(() => {
    handlePoseRef.current = handlePose;
  }, [handlePose]);

  useEffect(() => {
    loadSounds();
  }, []);

  if (plugin.state === 'loading') {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-white mt-4">Đang tải AI...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-sub2">
      {showCamera ? (
        <RNMediapipe
          style={{ flex: 1 }}
          onLandmark={data => {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            handlePoseRef.current(parsed);
          }}
        />
      ) : (
        <View className="flex-1 justify-center items-center bg-black">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-white mt-4">Đang xử lý kết quả...</Text>
        </View>
      )}

      <View className="absolute top-20 left-0 right-0 items-center z-10">
        {!isSessionActive ? (
          <TouchableOpacity
            onPress={handleStartSession}
            className="bg-emerald-500 px-4 py-2 rounded-full z-10"
          >
            <Text className="text-white text-xl font-bold">START RECORD</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleEndSession}
            className="bg-red-500 px-4 py-2 rounded-full z-10"
          >
            <Text className="text-white text-xl font-bold">END SESSION</Text>
          </TouchableOpacity>
        )}
      </View>

      {isRecording && (
        <View className="absolute top-16 right-5 flex-row items-center bg-black/60 px-3 py-1 rounded-full">
          <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
          <Text className="text-white font-bold">REC</Text>
        </View>
      )}
    </View>
  );
}
