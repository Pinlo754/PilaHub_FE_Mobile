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
  startGlobalRecording,
  stopGlobalRecording,
} from 'react-native-nitro-screen-recorder';
import storage from '@react-native-firebase/storage';
import { workoutSessionService } from '../../hooks/workoutSession.service';
import { mistakeLogService } from '../../hooks/mistakeLog.service';
import { CreateMistakeReq, MistakeLogReq } from '../../utils/MistakeLogType';

import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from "../../navigation/AppNavigator";
import { WorkoutSessionType } from '../../utils/WorkoutSessionType';
import { Video } from 'react-native-compressor';
import { getBodyPartId } from '../../utils/BodyPart';
import ViewShot from "react-native-view-shot";
type Props = {
  workoutSessionId: string;
  onFeedback: (data: { status: string; detail: string }) => void;
  captureMistakeImage: () => Promise<string | undefined>;
};

export default function AITracking({ workoutSessionId, onFeedback, captureMistakeImage }: Props) {
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
  const DEBOUNCE_TIME = 1250;
  const viewShotRef = useRef<ViewShot>(null);
  const pendingMistake = useRef<any>(null);
  const activeMistake = useRef<any>(null);
  const lastCorrectTime = useRef<number>(0);
  const [workoutSession, setWorkoutSession] = useState<WorkoutSessionType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorBodyPart, setErrorBodyPart] = useState<string | null>(null);
  const [heartRateList, setHeartRateList] = useState<any[]>([]);
  const BODY_PART_MAP: Record<string, number[]> = {
    "Lower Back": [23, 24],
    "Upper Back": [11, 12],
    "Left Knee": [25],
    "Right Knee": [26],
    "Left Elbow": [13],
    "Right Elbow": [14],
  };

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
      setHeartRateList([]);

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
    setIsSessionActive(false);
    setShowCamera(false);
    try {
      setIsSaving(true);
      const file = await stopGlobalRecording({
        settledTimeMs: 1000,
      });

      if (!file?.path) {
        Alert.alert('Error', 'No video file found');
        return;
      }

      if (activeMistake.current) {
        finalizeMistake(Date.now());
      }

      console.log("Original video:", file.path);

      // 🎥 Compress video
      const compressedVideo = await Video.compress(file.path, {
        compressionMethod: 'manual',
        bitrate: 5000000,
        //bitrate: 20000000,    //production
        //minimumFileSizeForCompress: 1000000000,   //production
        progressDivider: 10,
      },
        (progress) => {
          console.log(`Đang nén: ${Math.round(progress * 100)}%`);
        });

      // 🔥 Upload video đã nén
      const downloadURL = await uploadVideoToFirebase(compressedVideo);

      console.log('Video uploaded. URL:', downloadURL);

      await Promise.all(
        mistakeLogs.map(async log => {
          try {
            console.log('bắt đầu tải ảnh mistake')
            if (!log.imagePath || typeof log.imagePath !== "string") {
              console.log("skip upload (invalid path)", log.imagePath);
              return log;
            }
            const ref = storage().ref(
              `mistakes/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
            );

            await ref.putFile(log.imagePath);

            log.imageUrl = await ref.getDownloadURL();

            delete log.imagePath;
          }
          catch (e) {
            console.log("Upload error", e);
          }
        }
        )
      );

      await workoutSessionService.endWorkout(workoutSessionId, downloadURL);

      if (mistakeLogs) {
        const transformedMistakeLogs: MistakeLogReq[] = mistakeLogs.map(
          ({ bodyPart, side, recordedAtSecond, duration, imageUrl }) => ({
            bodyPartId: getBodyPartId(bodyPart) || '',
            details: `Form error at ${bodyPart} (${side})`,
            imageUrl: imageUrl || '',
            recordedAtSecond: recordedAtSecond,
            duration: duration || 0,
          })
        );

        const payload: CreateMistakeReq = {
          workoutSessionId,
          mistakeLogs: transformedMistakeLogs,
        };

        await mistakeLogService.createMistakeLog(payload);

      }

      const AIFeedback = await workoutSessionService.feedbackWorkout(workoutSessionId);;

      console.log('Mistake logs saved:', mistakeLogs);

      console.log('AI Feedback')
      navigation.navigate('AISummary', {
        feedback: AIFeedback,
        videoUrl: downloadURL,
        mistakeLog: mistakeLogs,
      });

    } catch (e) {
      console.error(e);
      setIsSaving(false);
    } finally {
      setIsSaving(false);
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

        const exerciseName = workoutSession?.exerciseName?.toLowerCase();

        const exIdx = LABELS.exercises.findIndex(e => e === 'plank');
        // const exIdx = LABELS.exercises.findIndex(
        //   e => e.toLowerCase() === exerciseName
        // );

        if (exIdx !== -1) {
          exArray[exIdx] = 1;
        }

        const outputs = await model.run([exArray, kpArray]);
        const bodyPartOutput = outputs[0] as Float32Array;
        const labelOutput = outputs[1] as Float32Array;
        const sideOutput = outputs[2] as Float32Array;
        const incorrectProb = labelOutput[0];

        if (incorrectProb < 0.2) {
          if (activeMistake.current) {
            handleCorrect();
            return;
          }

          const now = Date.now();

          if (now - lastCorrectTime.current > 400) {
            onFeedback({
              status: '✅ CHUẨN',
              detail: 'Tư thế chính xác',
            });
          }

          return;
        } else {
          const argMax = (arr: Float32Array) =>
            arr.reduce((best, val, idx) => (val > arr[best] ? idx : best), 0);

          const partIdx = argMax(bodyPartOutput);
          const sideIdx = argMax(sideOutput);

          const bodyPart = LABELS.body_parts[partIdx];
          const side = LABELS.sides[sideIdx];

          handleIncorrect(bodyPart, side);
        }
      } catch (err) {
        console.error(err);
      } finally {
        isProcessing.current = false;
      }
    },
    [model, isSessionActive],
  );

  const finalizeMistake = (endTime: number) => {
    if (!activeMistake.current) return;

    const duration =
      (endTime - activeMistake.current.startTime) / 1000;

    if (duration >= 1.25) {
      const log = {
        bodyPart: activeMistake.current.bodyPart,
        side: activeMistake.current.side,
        recordedAtSecond: activeMistake.current.recordedAtSecond,
        duration,
        imagePath: activeMistake.current.imagePath
      };

      setMistakeLogs(prev => [...prev, log]);
    }


    activeMistake.current = null;
  };

  const handleCorrect = () => {
    const now = Date.now();

    lastCorrectTime.current = now;

    if (!activeMistake.current) return;

    if (now - activeMistake.current.startTime >= DEBOUNCE_TIME) {
      finalizeMistake(now);
      setErrorBodyPart(null);
    }
  };

  const handleIncorrect = (bodyPart: string, side: string) => {
    const now = Date.now();

    const secondsFromStart =
      (now - sessionStartTime.current) / 1000;

    // nếu đang có active mistake
    if (activeMistake.current) {
      if (activeMistake.current.bodyPart !== bodyPart) {
        finalizeMistake(now);

        pendingMistake.current = {
          bodyPart,
          side,
          detectedAt: now,
        };
      }

      return;
    }

    // chưa có active -> xử lý pending
    if (!pendingMistake.current) {
      pendingMistake.current = {
        bodyPart,
        side,
        detectedAt: now,
      };
      return;
    }

    if (pendingMistake.current.bodyPart !== bodyPart) {
      pendingMistake.current = {
        bodyPart,
        side,
        detectedAt: now,
      };
      return;
    }

    // đủ 1.25s -> confirm mistake
    if (now - pendingMistake.current.detectedAt >= DEBOUNCE_TIME) {
      activeMistake.current = {
        bodyPart,
        side,
        recordedAtSecond: secondsFromStart,
        startTime: now,
        imagePath: ''
      };

      setErrorBodyPart(bodyPart);
      captureMistakeImage().then((path) => {
        console.log('Chụp ảnh lỗi thành công, path:', path);
        if (activeMistake.current) {
          activeMistake.current.imagePath = path;
        }
      });

      console.log('current mistake:', activeMistake.current)

      play(bodyPart.toLowerCase().replace(' ', ''));

      onFeedback({
        status: '❌ CẦN SỬA',
        detail: `${bodyPart} (${side})`,
      });

      pendingMistake.current = null;
    }
  };

  const handlePoseRef = useRef(handlePose);

  useEffect(() => {
    const fetchWorkoutSession = async () => {
      const res = await workoutSessionService.getById(workoutSessionId);
      setWorkoutSession(res);
    };

    fetchWorkoutSession();
  }, [workoutSessionId]);


  useEffect(() => {
    console.log(workoutSession);
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
      <ViewShot ref={viewShotRef} style={{ flex: 1 }}>
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
      </ViewShot>
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
      {isSaving && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
          }}
        >
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={{ color: 'white', marginTop: 10, fontSize: 16 }}>
            Đang lưu dữ liệu...
          </Text>
        </View>
      )}
    </View>
  );
}
