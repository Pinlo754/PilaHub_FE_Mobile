import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import api from '../../../hooks/axiosInstance';
import VideoPlayer from '../../AIPractice/components/VideoPlayer/VideoPlayer';
import { markPersonalExerciseCompleted } from '../../../services/personalExercise.service';
import { markPersonalScheduleCompleted } from '../../../services/personalSchedule.service';
import Toast from '../../../components/Toast';

// Helper: resolve possibly-relative video URL to absolute using axios baseURL
function resolveVideoSrc(raw?: string | null) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;

  // if starts with '/', join with host (strip trailing /api)
  const base = api?.defaults?.baseURL
    ? String(api.defaults.baseURL).replace(/\/api\/?$/, '')
    : '';

  if (s.startsWith('/')) {
    return base ? `${base}${s}` : s;
  }

  // otherwise assume relative path
  return base ? `${base}/${s}` : s;
}

export default function ScheduleDetail({ schedule, onVideoModalChange }: any) {
   const [isVideoVisible, setIsVideoVisible] = useState(false);
   const [isVideoPlay, setIsVideoPlay] = useState(true);
   const [videoSource, setVideoSource] = useState<string | null>(null);
   const [localExercises, setLocalExercises] = useState<any[]>([]);
   const [currentExercise, setCurrentExercise] = useState<any | null>(null);
   const [scheduleCompleted, setScheduleCompleted] = useState<boolean>(Boolean(schedule?.completed));
   const [toastVisible, setToastVisible] = useState(false);
   const [toastMessage, setToastMessage] = useState('');
   const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
   const prevProgressRef = useRef<number | null>(null);

   // initialize local exercises state whenever schedule prop changes
   useEffect(() => {
     const exs = Array.isArray(schedule?.exercises) ? schedule.exercises.map((e: any) => ({ ...e })) : [];
     setLocalExercises(exs);
     setScheduleCompleted(Boolean(schedule?.completed));
   }, [schedule]);
+
   // notify when schedule progress changes
   useEffect(() => {
     const current = Number(schedule?.progressPercent ?? schedule?.progress ?? NaN);
     const prev = prevProgressRef.current;
     if (!Number.isNaN(current) && prev !== null && current !== prev) {
       setToastMessage(`Tiến độ cập nhật: ${current}%`);
       setToastType('info');
       setToastVisible(true);
     }
     if (!Number.isNaN(current)) prevProgressRef.current = current;
   }, [schedule?.progressPercent, schedule?.progress]);

   if (!schedule) return null;

   const handleVideoEnd = async () => {
     // close modal first
     setIsVideoVisible(false);
     setIsVideoPlay(false);
     setVideoSource(null);
     if (typeof onVideoModalChange === 'function') onVideoModalChange(false);

     if (!currentExercise) return;

     // determine personalExercise id
     const personalId = currentExercise.personalExerciseId ?? currentExercise.personalExerciseIdRaw ?? currentExercise.id ?? currentExercise.exerciseId ?? null;

     // mark personal exercise complete if available
     if (personalId) {
       try {
         await markPersonalExerciseCompleted(personalId);
         // show toast
         setToastMessage('Đã đánh dấu bài tập hoàn thành');
         setToastType('success');
         setToastVisible(true);

         // update local state based on previous state snapshot
         const updated = localExercises.map(it => {
           const id = it.personalExerciseId ?? it.id ?? it.exerciseId ?? null;
           if (id === personalId) return { ...it, completed: true };
           return it;
         });
         setLocalExercises(updated);

         // Before marking schedule complete, re-fetch exercises from server to avoid stale state
         const scheduleId = schedule.personalScheduleId ?? schedule.id ?? schedule.scheduleId ?? schedule.personalScheduleIdRaw ?? null;
         if (scheduleId) {
           try {
             const res = await api.get(`/personal-exercises/schedule/${scheduleId}`);
             const serverExercises = Array.isArray(res?.data?.data) ? res.data.data : [];
             // normalize and update local state from server
             setLocalExercises(serverExercises.map((se: any) => ({ ...se })));

             const allDoneServer = serverExercises.length === 0 ? true : serverExercises.every((e: any) => e.completed === true);
             if (allDoneServer) {
               try {
                 await markPersonalScheduleCompleted(scheduleId);
                 setScheduleCompleted(true);
                 setToastMessage('Hoàn thành lịch tập');
                 setToastType('success');
                 setToastVisible(true);
               } catch (err) {
                 console.warn('[ScheduleDetail] mark schedule complete failed', err);
                 setToastMessage('Không thể cập nhật lịch tập');
                 setToastType('error');
                 setToastVisible(true);
               }
             }
           } catch (err) {
             console.warn('[ScheduleDetail] failed to refetch exercises before marking schedule', err);
             // fallback: use updated local array
             const allDone = updated.length === 0 ? true : updated.every(e => e.completed === true);
             if (allDone) {
               try {
                 await markPersonalScheduleCompleted(scheduleId);
                 setScheduleCompleted(true);
                 setToastMessage('Hoàn thành lịch tập');
                 setToastType('success');
                 setToastVisible(true);
               } catch (err2) {
                 console.warn('[ScheduleDetail] mark schedule complete failed', err2);
                 setToastMessage('Không thể cập nhật lịch tập');
                 setToastType('error');
                 setToastVisible(true);
               }
             }
           }
         }

       } catch (err) {
         console.warn('[ScheduleDetail] mark exercise complete failed', err);
         setToastMessage('Không thể cập nhật bài tập');
         setToastType('error');
         setToastVisible(true);
       }
     }
   };

   return (
     <View className="mx-4 mt-3">
       {/* Card (no banner) */}
       <View className="bg-white rounded-2xl border border-gray-100 shadow-lg">
         <View className="p-4">
           <View className="flex-row items-center justify-between">
             <Text className="text-2xl font-extrabold text-[#3A2A1A]">{schedule.scheduleName}</Text>
             {scheduleCompleted && (
               <View className="bg-green-100 rounded-full px-3 py-1">
                 <Text className="text-green-700 font-semibold">Hoàn thành</Text>
               </View>
             )}
           </View>
           <Text className="text-gray-500 mt-1">{schedule.dayOfWeek} • {schedule.durationMinutes} phút</Text>

           {/* Pills */}
           <View className="flex-row flex-wrap mt-3">
             <View className="flex-row items-start bg-[#F3EDE3] px-3 py-3 rounded-xl w-full">
               <Ionicons name="information-circle-outline" size={18} color="#3A2A1A" />
               <Text className="text-[#8B4513] font-semibold ml-3 flex-1" numberOfLines={3} ellipsizeMode="tail">
                 {schedule.description ?? 'Không có mô tả'}
               </Text>
             </View>
           </View>

           {/* Exercises list */}
           <View className="mt-4">
             {localExercises.map((ex: any, idx: number) => (
               <View key={ex.id ?? idx} className="flex-row items-center py-3 border-b border-[#F3EDE3]">
                 <Image
                   source={{ uri: ex.thumbnailUrl ?? ex.imageUrl ?? ex.image ?? 'https://via.placeholder.com/72' }}
                   className="w-16 h-16 rounded-lg bg-gray-100"
                   resizeMode="cover"
                 />

                 <View className="flex-1 ml-3">
                   <Text className="text-base font-semibold text-[#3A2A1A]">{idx + 1}. {ex.exerciseName}</Text>
                   <Text className="text-sm text-gray-400 mt-1">{ex.points ? `${ex.points}p` : ex.durationSeconds ? `${Math.ceil((ex.durationSeconds ?? 0) / 60)}p` : ''}</Text>
                 </View>

                 <View className="w-12 items-center justify-center">
                   {ex.locked ? (
                     <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                   ) : ex.completed ? (
                     // completed: replace play button with checkmark
                     <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                   ) : (
                     <TouchableOpacity
                       className="w-9 h-9 rounded-full bg-[#8B4513] items-center justify-center"
                       activeOpacity={0.8}
                       onPress={async () => {
                         // set current exercise so onEnd can reference
                         setCurrentExercise(ex);
                         // Always open modal and prevent automatic navigation to ExerciseDetail
                         setIsVideoVisible(true);
                         if (typeof onVideoModalChange === 'function') onVideoModalChange(true);

                         const rawSrc = ex.practiceVideoUrl ?? ex.practice_video_url ?? ex.theoryVideoUrl ?? ex.theory_video_url ?? ex.videoUrl ?? ex.video_url ?? ex.video ?? null;
                         let src = resolveVideoSrc(rawSrc);

                         // If no direct src, try fetching tutorial from backend
                         if (!src) {
                           const exerciseId = ex.exerciseId ?? ex.id ?? ex.exercise_id ?? ex.exerciseIdRaw;
                           if (exerciseId) {
                             try {
                               const res = await api.get(`/tutorials/exercise/${exerciseId}`);
                               const tut = res?.data?.data ?? null;
                               const tutSrc = resolveVideoSrc(tut?.practiceVideoUrl ?? tut?.practice_video_url ?? tut?.theoryVideoUrl ?? tut?.theory_video_url ?? null);
                               if (tutSrc) src = tutSrc;
                             } catch (err) {
                               console.warn('[ScheduleDetail] tutorial fetch failed', err);
                             }
                           }
                         }

                         if (src) {
                           setVideoSource(src);
                           setIsVideoPlay(true);
                         } else {
                           // no video available — show modal with message (user can close)
                           setVideoSource(null);
                           setIsVideoPlay(false);
                         }
                       }}
                     >
                       <Ionicons name="play" size={16} color="#fff" />
                     </TouchableOpacity>
                   )}
                 </View>
               </View>
             ))}
           </View>
         </View>
       </View>

       {/* Video modal */}
       <Modal
         visible={isVideoVisible}
         animationType="slide"
         onRequestClose={() => {
           setIsVideoVisible(false);
           setIsVideoPlay(false);
           setVideoSource(null);
         }}
       >
         <View style={modalStyles.container}>
           <View style={modalStyles.header}>
             <TouchableOpacity
               onPress={() => {
                 setIsVideoVisible(false);
                 setIsVideoPlay(false);
                 setVideoSource(null);
                 if (typeof onVideoModalChange === 'function') onVideoModalChange(false);
               }}
             >
               <Ionicons name="close" size={28} color="#fff" />
             </TouchableOpacity>
           </View>

           {videoSource ? (
             <View style={modalStyles.playerWrap}>
               <VideoPlayer
                 source={videoSource}
                 isVideoPlay={isVideoPlay}
                 togglePlayButton={() => setIsVideoPlay((v) => !v)}
                 onEnd={handleVideoEnd}
               />
             </View>
           ) : (
             <View style={modalStyles.center}><Text>Không có video</Text></View>
           )}
         </View>
       </Modal>
+      {/* Toast */}
+      <Toast visible={toastVisible} message={toastMessage} type={toastType} onHidden={() => setToastVisible(false)} />
 
     </View>
   );
 }
 
 const modalStyles = StyleSheet.create({
   container: { flex: 1, backgroundColor: '#000' },
   header: { height: 56, paddingHorizontal: 16, alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'transparent' },
   playerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
   center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
 });