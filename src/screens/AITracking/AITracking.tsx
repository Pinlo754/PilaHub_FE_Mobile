// import React, { useCallback, useEffect, useRef, useState } from 'react';
// import {
//   View,
//   Text,
//   ActivityIndicator,
//   TouchableOpacity,
//   Alert,
// } from 'react-native';
// import { RNMediapipe } from '@thinksys/react-native-mediapipe';
// import { useTensorflowModel } from 'react-native-fast-tflite';
// import { LABELS, SCALER_MEAN, SCALER_SCALE } from '../../hooks/poseModel';
// import { useSoundManager } from './useSoundManager';
// import {
//   useGlobalRecording,
//   startGlobalRecording,
//   stopGlobalRecording,
// } from 'react-native-nitro-screen-recorder';
// import storage from '@react-native-firebase/storage';
// import { workoutSessionService } from '../../hooks/workoutSession.service';
// import { mistakeLogService } from '../../hooks/mistakeLog.service';
// import { CreateMistakeReq, MistakeLogReq } from '../../utils/MistakeLogType';

// import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
// import { RootStackParamList } from "../../navigation/AppNavigator";
// import { WorkoutSessionType } from '../../utils/WorkoutSessionType';
// import { Video } from 'react-native-compressor';
// import { getBodyPartId } from '../../utils/BodyPart';
// import ViewShot from "react-native-view-shot";
// import { useBle } from '../../services/BleProvider';
// import api from '../../hooks/axiosInstance';
// import { heartRateService } from '../../hooks/heartRate.service';
// type Props = {
//   workoutSessionId: string;
//   onFeedback: (data: { status: string; detail: string }) => void;
//   captureMistakeImage: () => Promise<string | undefined>;
// };

// export default function AITracking({ workoutSessionId, onFeedback, captureMistakeImage }: Props) {
//   const navigation = useNavigation<NavigationProp<RootStackParamList>>();
//   const plugin = useTensorflowModel(
//     require('../../assets/pose_correction_exercise_aware.tflite'),
//   );
//   const model = plugin.model;

//   const { loadSounds, play } = useSoundManager();

//   const { isRecording } = useGlobalRecording({
//     onRecordingStarted: () => {
//       console.log('🎬 Global Recording Started');
//       sessionStartTime.current = Date.now();
//       setIsSessionActive(true);
//     },
//     onRecordingFinished: file => {
//       if (file) {
//         console.log('🎥 File saved:', file.path);
//         Alert.alert(
//           'Recording Complete',
//           `Duration: ${file.duration}s\nSize: ${file.size} bytes`,
//         );
//       }
//     },
//   });

//   const isProcessing = useRef(false);
//   const [isSessionActive, setIsSessionActive] = useState(false);
//   const sessionStartTime = useRef<number>(0);
//   const { hr } = useBle();
//   const hrSamplesRef = useRef<Array<{ heartRate: number; recordedAt: number }>>([]);
//   const hrTimerRef = useRef<number | null>(null);
//   const [mistakeLogs, setMistakeLogs] = useState<any[]>([]);
//   const [showCamera, setShowCamera] = useState(true);
//   const DEBOUNCE_TIME = 1250;
//   const viewShotRef = useRef<ViewShot>(null);
//   const pendingMistake = useRef<any>(null);
//   const activeMistake = useRef<any>(null);
//   const lastCorrectTime = useRef<number>(0);
//   const [workoutSession, setWorkoutSession] = useState<WorkoutSessionType | null>(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const [errorBodyPart, setErrorBodyPart] = useState<string | null>(null);
//   const [heartRateList, setHeartRateList] = useState<any[]>([]);
//   const BODY_PART_MAP: Record<string, number[]> = {
//     "Lower Back": [23, 24],
//     "Upper Back": [11, 12],
//     "Left Knee": [25],
//     "Right Knee": [26],
//     "Left Elbow": [13],
//     "Right Elbow": [14],
//   };

//   const LEFT_SHOULDER = 11;
//   const RIGHT_SHOULDER = 12;
//   const LEFT_ELBOW = 13;
//   const RIGHT_ELBOW = 14;
//   const LEFT_WRIST = 15;
//   const RIGHT_WRIST = 16;
//   const LEFT_HIP = 23;
//   const RIGHT_HIP = 24;
//   const LEFT_KNEE = 25;
//   const RIGHT_KNEE = 26;
//   const LEFT_ANKLE = 27;
//   const RIGHT_ANKLE = 28;
//   const LEFT_EAR = 7;
//   const RIGHT_EAR = 8;

//   const getXYZ = (kps: number[], idx: number) => [
//     kps[idx * 4],
//     kps[idx * 4 + 1],
//     kps[idx * 4 + 2],
//   ];

//   const getXY = (kps: number[], idx: number) => [
//     kps[idx * 4],
//     kps[idx * 4 + 1],
//   ];

//   const calcAngle = (a: number[], b: number[], c: number[]) => {
//     const ba = [a[0] - b[0], a[1] - b[1]];
//     const bc = [c[0] - b[0], c[1] - b[1]];
//     const dot = ba[0] * bc[0] + ba[1] * bc[1];
//     const norm = Math.hypot(...ba) * Math.hypot(...bc) + 1e-8;
//     const cos = Math.max(-1, Math.min(1, dot / norm));
//     return Math.acos(cos) * (180 / Math.PI);
//   };

//   const preprocess = (raw_kps: number[]) => {
//     const hipC = [
//       (raw_kps[LEFT_HIP * 4] + raw_kps[RIGHT_HIP * 4]) / 2,
//       (raw_kps[LEFT_HIP * 4 + 1] + raw_kps[RIGHT_HIP * 4 + 1]) / 2,
//       (raw_kps[LEFT_HIP * 4 + 2] + raw_kps[RIGHT_HIP * 4 + 2]) / 2,
//     ];

//     const shC = [
//       (raw_kps[LEFT_SHOULDER * 4] + raw_kps[RIGHT_SHOULDER * 4]) / 2,
//       (raw_kps[LEFT_SHOULDER * 4 + 1] + raw_kps[RIGHT_SHOULDER * 4 + 1]) / 2,
//       (raw_kps[LEFT_SHOULDER * 4 + 2] + raw_kps[RIGHT_SHOULDER * 4 + 2]) / 2,
//     ];

//     const scale =
//       Math.hypot(
//         shC[0] - hipC[0],
//         shC[1] - hipC[1],
//         shC[2] - hipC[2],
//       ) + 1e-8;

//     const norm: number[] = [];
//     for (let i = 0; i < 33; i++) {
//       const xyz = getXYZ(raw_kps, i);
//       norm.push(
//         (xyz[0] - hipC[0]) / scale,
//         (xyz[1] - hipC[1]) / scale,
//         (xyz[2] - hipC[2]) / scale,
//         raw_kps[i * 4 + 3],
//       );
//     }

//     const angles = [
//       calcAngle(getXY(raw_kps, LEFT_SHOULDER), getXY(raw_kps, LEFT_HIP), getXY(raw_kps, LEFT_ANKLE)),
//       calcAngle(getXY(raw_kps, RIGHT_SHOULDER), getXY(raw_kps, RIGHT_HIP), getXY(raw_kps, RIGHT_ANKLE)),
//       calcAngle(getXY(raw_kps, LEFT_SHOULDER), getXY(raw_kps, LEFT_ELBOW), getXY(raw_kps, LEFT_WRIST)),
//       calcAngle(getXY(raw_kps, RIGHT_SHOULDER), getXY(raw_kps, RIGHT_ELBOW), getXY(raw_kps, RIGHT_WRIST)),
//       calcAngle(getXY(raw_kps, LEFT_HIP), getXY(raw_kps, LEFT_SHOULDER), getXY(raw_kps, LEFT_ELBOW)),
//       calcAngle(getXY(raw_kps, RIGHT_HIP), getXY(raw_kps, RIGHT_SHOULDER), getXY(raw_kps, RIGHT_ELBOW)),
//       calcAngle(getXY(raw_kps, LEFT_EAR), getXY(raw_kps, LEFT_SHOULDER), getXY(raw_kps, LEFT_HIP)),
//       calcAngle(getXY(raw_kps, RIGHT_EAR), getXY(raw_kps, RIGHT_SHOULDER), getXY(raw_kps, RIGHT_HIP)),
//       calcAngle(getXY(raw_kps, LEFT_HIP), getXY(raw_kps, LEFT_KNEE), getXY(raw_kps, LEFT_ANKLE)),
//       calcAngle(getXY(raw_kps, RIGHT_HIP), getXY(raw_kps, RIGHT_KNEE), getXY(raw_kps, RIGHT_ANKLE)),
//       Math.abs(getXYZ(raw_kps, LEFT_HIP)[1] - getXYZ(raw_kps, RIGHT_HIP)[1]) * 100,
//       Math.abs(getXYZ(raw_kps, LEFT_SHOULDER)[1] - getXYZ(raw_kps, RIGHT_SHOULDER)[1]) * 100,
//     ];

//     const full = [...norm, ...angles];
//     const scaled = full.map((v, i) => (v - SCALER_MEAN[i]) / (SCALER_SCALE[i] || 1));
//     return { scaled, angles };
//   };

//   const ruleOverride = (angles: number[], modelPart: string) => {
//     const bodyAvg = (angles[0] + angles[1]) / 2;
//     const neckAvg = (angles[6] + angles[7]) / 2;

//     if (bodyAvg < 165) return 'Hips';
//     if (neckAvg < 150) return 'Neck';
//     return modelPart;
//   };

//   const uploadVideoToFirebase = async (filePath: string) => {
//     try {
//       const filename = `videos/${Date.now()}.mp4`;

//       const reference = storage().ref(filename);

//       const task = reference.putFile(filePath);

//       task.on('state_changed', taskSnapshot => {
//         const percent =
//           (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
//         console.log('Upload progress:', percent.toFixed(0) + '%');
//       });

//       await task;

//       const downloadURL = await reference.getDownloadURL();

//       console.log('🔥 VIDEO URL:', downloadURL);

//       return downloadURL;
//     } catch (error) {
//       console.error('Upload video error:', error);
//       throw error;
//     }
//   };
//   /* ===========================
//        🎥 START GLOBAL RECORDING
//     ============================ */
//   const handleStartSession = async () => {
//     try {
//       setMistakeLogs([]);
//       setHeartRateList([]);

//       // reset HR samples
//       hrSamplesRef.current = [];

//       // mark session start immediately to ensure recordedAt is relative
//       sessionStartTime.current = Date.now();

//       startGlobalRecording({
//         onRecordingError: err => {
//           Alert.alert('Recording error', err.message);
//         },
//       });

//       setIsSessionActive(true);
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   /* ===========================
//        🛑 STOP GLOBAL RECORDING
//     ============================ */
//   const handleEndSession = async () => {
//     setIsSessionActive(false);
//     setShowCamera(false);
//     try {
//       // stop HR sampling
//       if (hrTimerRef.current) {
//         clearInterval(hrTimerRef.current as unknown as number);
//         hrTimerRef.current = null;
//       }
//       setIsSaving(true);
//       const file = await stopGlobalRecording({
//         settledTimeMs: 1000,
//       });

//       if (!file?.path) {
//         Alert.alert('Error', 'No video file found');
//         return;
//       }

//       if (activeMistake.current) {
//         finalizeMistake(Date.now());
//       }

//       console.log("Original video:", file.path);

//       // // 🎥 Compress video
//       // const compressedVideo = await Video.compress(file.path, {
//       //   compressionMethod: 'manual',
//       //   // bitrate: 5000000,
//       //   bitrate: 20000000,    //production
//       //   minimumFileSizeForCompress: 1000000000,   //production
//       //   progressDivider: 10,
//       // },
//       //   (progress) => {
//       //     console.log(`Đang nén: ${Math.round(progress * 100)}%`);
//       //   });

//       // 🔥 Upload video đã nén
//       // const downloadURL = await uploadVideoToFirebase(compressedVideo);
// const downloadURL = await uploadVideoToFirebase(file.path);

//       console.log('Video uploaded. URL:', downloadURL);

//       // send HR samples batch to backend if any
//       try {
//         const samples = hrSamplesRef.current || [];
//         if (samples.length > 0) {
//           // simple dedupe: collapse consecutive samples with same HR
//           const compressed: Array<{ heartRate: number; recordedAt: number }> = [];
//           for (const s of samples) {
//             const last = compressed[compressed.length - 1];
//             if (!last || last.heartRate !== s.heartRate) {
//               compressed.push(s);
//             }
//           }
//           console.log('Sending HR logs batch (compressed):', compressed.length, 'original:', samples.length);
//           await heartRateService.sendBatch(workoutSessionId, compressed);
//           console.log('HR logs batch sent:', compressed.length);
//         }
//       } catch (e) {
//         console.warn('Failed to send HR logs batch', e);
//       }

//       await Promise.all(
//         mistakeLogs.map(async log => {
//           try {
//             console.log('bắt đầu tải ảnh mistake')
//             if (!log.imagePath || typeof log.imagePath !== "string") {
//               console.log("skip upload (invalid path)", log.imagePath);
//               return log;
//             }
//             const ref = storage().ref(
//               `mistakes/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
//             );

//             await ref.putFile(log.imagePath);

//             log.imageUrl = await ref.getDownloadURL();

//             delete log.imagePath;
//           }
//           catch (e) {
//             console.log("Upload error", e);
//           }
//         }
//         )
//       );

//       await workoutSessionService.endWorkout(workoutSessionId, downloadURL);

//       if (mistakeLogs) {
//         const transformedMistakeLogs: MistakeLogReq[] = mistakeLogs.map(
//           ({ bodyPart, side, recordedAtSecond, duration, imageUrl }) => ({
//             bodyPartId: getBodyPartId(bodyPart) || '',
//             details: `Form error at ${bodyPart} (${side})`,
//             imageUrl: imageUrl || '',
//             recordedAtSecond: recordedAtSecond,
//             duration: duration || 0,
//           })
//         );

//         const payload: CreateMistakeReq = {
//           workoutSessionId,
//           mistakeLogs: transformedMistakeLogs,
//         };

//         await mistakeLogService.createMistakeLog(payload);

//       }

//       const AIFeedback = await workoutSessionService.feedbackWorkout(workoutSessionId);;

//       console.log('Mistake logs saved:', mistakeLogs);

//       console.log('AI Feedback')
//       // pass HR samples to AISummary so UI can render heart rate timeline
//       navigation.navigate('AISummary', {
//         feedback: AIFeedback,
//         videoUrl: downloadURL,
//         mistakeLog: mistakeLogs,
//         heartRateLogs: hrSamplesRef.current || [],
//       });

//     } catch (e) {
//       console.error(e);
//       setIsSaving(false);
//     } finally {
//       setIsSaving(false);
//       // reset session start time
//       sessionStartTime.current = 0;
//     }
//   };

//   /* ===========================
//        🧠 AI INFERENCE
//     ============================ */
//   const handlePose = useCallback(
//     async (data: any) => {
//       if (!isSessionActive) return;

//       if (!data?.landmarks || !model) return;
//       if (isProcessing.current) return;

//       try {
//         isProcessing.current = true;

//         const posePoints = data.landmarks;
//         if (posePoints.length < 33) return;

//         const raw_kps: number[] = [];
//         for (let i = 0; i < 33; i++) {
//           const lm = posePoints[i];
//           raw_kps.push(lm.x ?? 0, lm.y ?? 0, lm.z ?? 0, lm.visibility ?? 0);
//         }

//         const { scaled, angles } = preprocess(raw_kps);
//         const kpArray = new Float32Array(scaled);

//         const exArray = new Float32Array(8).fill(0);
//         const exerciseName = workoutSession?.exerciseName?.toLowerCase();

//         const exIdx = LABELS.exercises.findIndex(e => e === 'plank');
//         // const exIdx = LABELS.exercises.findIndex(
//         //   e => e.toLowerCase() === exerciseName
//         // );

//         if (exIdx !== -1) {
//           exArray[exIdx] = 1;
//         }

//         const outputs = await model.run([kpArray, exArray]);

//         let bodyPartOutput: Float32Array | null = null;

//         for (const out of outputs) {
//           const arr = out as Float32Array;
//           if (arr.length === LABELS.body_parts.length) {
//             bodyPartOutput = arr;
//           }
//         }

//         if (!bodyPartOutput) {
//           console.error('Lỗi: Không tìm thấy output body_part từ Model', {
//             isArray: Array.isArray(outputs),
//             outputsType: typeof outputs,
//             expectedBodyPartsLen: LABELS.body_parts.length,
//             outputs: outputs.map((o, idx) => {
//               const arr = o as Float32Array;
//               return {
//                 index: idx,
//                 length: arr?.length ?? null,
//                 isFloat32Array: arr instanceof Float32Array,
//                 sample: Array.from(arr ? arr.slice(0, 8) : []),
//                 type: Object.prototype.toString.call(arr),
//               };
//             }),
//           });
//           return;
//         }

//         const argMax = (arr: Float32Array) =>
//           arr.reduce((best, val, idx) => (val > arr[best] ? idx : best), 0);

//         const partIdx = argMax(bodyPartOutput);
//         let modelBodyPart = LABELS.body_parts[partIdx];
//         const finalBodyPart = ruleOverride(angles, modelBodyPart);

//         console.log('AI model debug:', {
//           scaledLength: scaled.length,
//           kpArraySample: Array.from(kpArray.slice(0, 16)),
//           exArray: Array.from(exArray),
//           outputShapes: [bodyPartOutput.length],
//           bodyPartOutput: Array.from(bodyPartOutput),
//           modelBodyPart,
//           finalBodyPart,
//         });

//         if (finalBodyPart === 'none') {
//           if (activeMistake.current) {
//             handleCorrect();
//             return;
//           }

//           const now = Date.now();
//           if (now - lastCorrectTime.current > 1250) {
//             onFeedback({
//               status: '✅ CHUẨN',
//               detail: 'Tư thế chính xác',
//             });
//             lastCorrectTime.current = now;
//           }
//         } else {
//           handleIncorrect(finalBodyPart, 'both');
//         }
//       } catch (err) {
//         console.error(err);
//       } finally {
//         isProcessing.current = false;
//       }
//     },
//     [model, isSessionActive],
//   );

//   const finalizeMistake = (endTime: number) => {
//     if (!activeMistake.current) return;

//     const duration =
//       (endTime - activeMistake.current.startTime) / 1000;

//     if (duration >= 1.25) {
//       const log = {
//         bodyPart: activeMistake.current.bodyPart,
//         side: activeMistake.current.side,
//         recordedAtSecond: activeMistake.current.recordedAtSecond,
//         duration,
//         imagePath: activeMistake.current.imagePath
//       };

//       setMistakeLogs(prev => [...prev, log]);
//     }

//     activeMistake.current = null;
//   };

//   const handleCorrect = () => {
//     const now = Date.now();

//     lastCorrectTime.current = now;

//     if (!activeMistake.current) return;

//     if (now - activeMistake.current.startTime >= DEBOUNCE_TIME) {
//       finalizeMistake(now);
//       setErrorBodyPart(null);
//     }
//   };

//   const handleIncorrect = (bodyPart: string, side: string) => {
//     const now = Date.now();

//     const secondsFromStart =
//       (now - sessionStartTime.current) / 1000;

//     // nếu đang có active mistake
//     if (activeMistake.current) {
//       if (activeMistake.current.bodyPart !== bodyPart) {
//         finalizeMistake(now);

//         pendingMistake.current = {
//           bodyPart,
//           side,
//           detectedAt: now,
//         };
//       }

//       return;
//     }

//     // chưa có active -> xử lý pending
//     if (!pendingMistake.current) {
//       pendingMistake.current = {
//         bodyPart,
//         side,
//         detectedAt: now,
//       };
//       return;
//     }

//     if (pendingMistake.current.bodyPart !== bodyPart) {
//       pendingMistake.current = {
//         bodyPart,
//         side,
//         detectedAt: now,
//       };
//       return;
//     }

//     // đủ 1.25s -> confirm mistake
//     if (now - pendingMistake.current.detectedAt >= DEBOUNCE_TIME) {
//       activeMistake.current = {
//         bodyPart,
//         side,
//         recordedAtSecond: secondsFromStart,
//         startTime: now,
//         imagePath: ''
//       };

//       setErrorBodyPart(bodyPart);
//       captureMistakeImage().then((path) => {
//         console.log('Chụp ảnh lỗi thành công, path:', path);
//         if (activeMistake.current) {
//           activeMistake.current.imagePath = path;
//         }
//       });

//       console.log('current mistake:', activeMistake.current)

//       play(bodyPart.toLowerCase().replace(' ', ''));

//       onFeedback({
//         status: '❌ CẦN SỬA',
//         detail: `${bodyPart} (${side})`,
//       });

//       pendingMistake.current = null;
//     }
//   };

//   const handlePoseRef = useRef(handlePose);

//   useEffect(() => {
//     const fetchWorkoutSession = async () => {
//       const res = await workoutSessionService.getById(workoutSessionId);
//       setWorkoutSession(res);
//     };

//     fetchWorkoutSession();
//   }, [workoutSessionId]);

//   useEffect(() => {
//     console.log(workoutSession);
//     handlePoseRef.current = handlePose;
//   }, [handlePose]);

//   useEffect(() => {
//     loadSounds();
//   }, []);

//   // start/stop HR sampling while session active
//   useEffect(() => {
//     if (isSessionActive) {
//       // ensure previous timer cleared
//       if (hrTimerRef.current) {
//         clearInterval(hrTimerRef.current as unknown as number);
//         hrTimerRef.current = null;
//       }
//       // sample every 500ms
//       hrTimerRef.current = setInterval(() => {
//         try {
//           const s = sessionStartTime.current;
//           if (!s || s === 0) return; // wait until recording started
//           if (typeof hr !== 'number' || hr === null) return;
//           const recordedAt = Math.round((Date.now() - s) / 1000);
//           hrSamplesRef.current.push({ heartRate: hr, recordedAt });
//         } catch (e) {
//           // ignore sampling errors
//         }
//       }, 500) as unknown as number;
//     } else {
//       if (hrTimerRef.current) {
//         clearInterval(hrTimerRef.current as unknown as number);
//         hrTimerRef.current = null;
//       }
//     }
//     return () => {
//       if (hrTimerRef.current) {
//         clearInterval(hrTimerRef.current as unknown as number);
//         hrTimerRef.current = null;
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isSessionActive, hr]);

//   if (plugin.state === 'loading') {
//     return (
//       <View className="flex-1 justify-center items-center bg-black">
//         <ActivityIndicator size="large" color="#10b981" />
//         <Text className="text-white mt-4">Đang tải AI...</Text>
//       </View>
//     );
//   }

//   return (
//     <View className="flex-1 bg-background-sub2">
//       <ViewShot ref={viewShotRef} style={{ flex: 1 }}>
//         {showCamera ? (
//           <RNMediapipe
//             style={{ flex: 1 }}
//             onLandmark={data => {
//               const parsed = typeof data === 'string' ? JSON.parse(data) : data;
//               handlePoseRef.current(parsed);
//             }}
//           />
//         ) : (
//           <View className="flex-1 justify-center items-center bg-black">
//             <ActivityIndicator size="large" color="#10b981" />
//             <Text className="text-white mt-4">Đang xử lý kết quả...</Text>
//           </View>
//         )}
//       </ViewShot>
//       <View className="absolute top-20 left-0 right-0 items-center z-10">
//         {!isSessionActive ? (
//           <TouchableOpacity
//             onPress={handleStartSession}
//             className="bg-emerald-500 px-4 py-2 rounded-full z-10"
//           >
//             <Text className="text-white text-xl font-bold">START RECORD</Text>
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity
//             onPress={handleEndSession}
//             className="bg-red-500 px-4 py-2 rounded-full z-10"
//           >
//             <Text className="text-white text-xl font-bold">END SESSION</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       {isRecording && (
//         <View className="absolute top-16 right-5 flex-row items-center bg-black/60 px-3 py-1 rounded-full">
//           <View className="w-3 h-3 bg-red-500 rounded-full mr-2" />
//           <Text className="text-white font-bold">REC</Text>
//         </View>
//       )}
//       {isSaving && (
//         <View
//           style={{
//             position: 'absolute',
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             backgroundColor: 'rgba(0,0,0,0.8)',
//             justifyContent: 'center',
//             alignItems: 'center',
//             zIndex: 999,
//           }}
//         >
//           <ActivityIndicator size="large" color="#10b981" />
//           <Text style={{ color: 'white', marginTop: 10, fontSize: 16 }}>
//             Đang lưu dữ liệu...
//           </Text>
//         </View>
//       )}
//     </View>
//   );
// }

import { Text, View } from 'react-native';
import React, { Component } from 'react';

export class AITracking extends Component {
  render() {
    return (
      <View>
        <Text>AITracking</Text>
      </View>
    );
  }
}

export default AITracking;
