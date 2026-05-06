import React, { useEffect, useMemo, useState } from 'react';
import { Text, ScrollView, View, Image, Pressable, StyleSheet, Modal, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import BodySilhouetteOverlay from './BodySilhouetteOverlay';
import { useOnboardingStore } from '../../../store/onboarding.store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingOverlay from '../../../components/LoadingOverlay';
import Toast from '../../../components/Toast';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { RoadmapServices } from '../../../hooks/roadmap.service';
import { exerciseService } from '../../../hooks/exercise.service';
import { Picker } from '@react-native-picker/picker'
import { CoachService } from '../../../hooks/coach.service';

type ExerciseEditContext = {
    stageIndex: number
    scheduleIndex: number
    exerciseIndex: number
}
type Props = NativeStackScreenProps<RootStackParamList, 'TraineeHealthProfileResult'>;

function mmToCm(mm?: number | null) {
    if (mm == null) return undefined;
    const n = Number(mm);
    if (isNaN(n)) return undefined;
    return +(n / 10).toFixed(0);
}
function gToKg(g?: number | null) {
    if (g == null) return undefined;
    const n = Number(g);
    if (isNaN(n)) return undefined;
    return +(n / 1000).toFixed(0);
}

export default function TraineeHealthProfileResult({ route, navigation }: Props) {
    const nav = useNavigation();
    const onboarding = useOnboardingStore((s) => s.data);
    const setData = useOnboardingStore((s) => s.setData);
    const {
        RequestItem,
        measurements: rawMeasurements,
        rawResponse
    } = route.params as any;

    function parseProfile(entry: any) {
        const out: any = { measurements: {}, meta: {} };
        if (!entry) return out;

        // Lấy data từ healthProfile nếu có, không thì dùng entry
        const data = entry?.healthProfile ?? entry ?? {};

        // Parse metadata nếu nó là string (như trong JSON của bạn)
        const metadata = typeof data.metadata === 'string'
            ? (() => { try { return JSON.parse(data.metadata); } catch { return {}; } })()
            : data.metadata ?? {};

        const bodyComp = metadata?.bodyComposition ?? {};
        const extra = metadata?.extraMeasurements ?? {};

        // THÔNG TIN CƠ BẢN
        out.height = data.heightCm ?? metadata?.input?.heightCm;
        out.weight = data.weightKg ?? metadata?.input?.weightKg;
        out.bodyFat = data.bodyFatPercentage ?? bodyComp?.bodyFatPercentage;
        out.muscle = data.muscleMassKg ?? bodyComp?.muscleMassKg;
        out.bmi = data.bmi;

        // MAPPING SỐ ĐO TỪ extraMeasurements
        out.measurements = {
            chest: extra?.bustCm,
            waist: extra?.waistCm,
            hip: extra?.hipCm,
            thigh: extra?.thighCm,
            calf: extra?.calfCm,
            bicep: extra?.bicepCm,
            forearm: extra?.forearmCm,
            shoulder: extra?.shoulderCm,
            neck: extra?.neckCm,
        };

        out.source = data.source;
        out.createdAt = data.createdAt;
        return out;
    }

    const parsed = parseProfile(rawResponse?.entry ?? rawResponse ?? {});

    const display = useMemo(() => {
        // Nếu parsed đã có measurements từ extraMeasurements, ưu tiên dùng luôn
        if (parsed.measurements && Object.values(parsed.measurements).some(v => v !== undefined)) {
            return {
                bust: parsed.measurements.chest,
                waist: parsed.measurements.waist,
                hip: parsed.measurements.hip,
                thigh: parsed.measurements.thigh,
                bicep: parsed.measurements.bicep,
                calf: parsed.measurements.calf,
                shoulder: parsed.measurements.shoulder,
                height_est: parsed.height,
                weight_est: parsed.weight,
            };
        }

        // Logic fallback cũ cho rawMeasurements (giữ nguyên nếu cần)
        const arr: any[] = Array.isArray(rawMeasurements) ? rawMeasurements : [];
        const out: any = {};
        // ... (phần logic loop qua m.name cũ của bạn)
        return out;
    }, [parsed, rawMeasurements]);

    const whr = display.waist && display.hip ? (display.waist / display.hip).toFixed(2) : undefined;

    const saveMeasurements = async () => {
        try {
            const map: any = {};
            if (display.shoulder) map.shoulder = display.shoulder;
            if (display.waist) map.waist = display.waist;
            if (display.hip) map.hip = display.hip;
            if (display.thigh) map.thigh = display.thigh;
            if (display.height_est) map.height = display.height_est;
            if (display.weight_est) map.weight = display.weight_est;

            if (Object.keys(map).length > 0) {
                setData(map);
                await AsyncStorage.setItem('bodygram:savedMeasurements', JSON.stringify(display));
                Alert.alert('Lưu thành công', 'Số đo đã được lưu vào hồ sơ.');
            } else {
                Alert.alert('Không có số đo', 'Không tìm thấy số đo hợp lệ để lưu.');
            }
        } catch (e) {
            console.log('Save measurements error', e);
            Alert.alert('Lỗi', 'Không thể lưu số đo.');
        }
    };

    const [loading, setLoading] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

    const saveRoadmap = async () => {
        try {
            setLoading(true);

            await CoachService.acceptRequestRoadmap(RequestItem.requestId)
            const payload = {
                aiResponse: roadmap,
                traineeId: RequestItem.traineeId,
                primaryGoalId: RequestItem.primaryGoalId,
                secondaryGoalIds: RequestItem.secondaryGoalIds
            };

            const res = await RoadmapServices.saveRoadmap(payload);

            console.log("saveRoadmap result", res);

            if (res) {

                navigation.navigate('ListRequest');
            } else {
                Alert.alert("Lỗi", "Không thể lưu roadmap");
            }

        } catch (e) {
            console.error("save roadmap error", e);
        } finally {
            setLoading(false);
        }
    };
    console.log('Rendered BodyGramResult with measurements:', saveMeasurements);

    const statusColor = {
        PENDING: '#F59E0B',
        ACCEPTED: '#10B981',
        REJECTED: '#EF4444',
    };

    const [roadmap, setRoadmap] = useState<any>(null);
    const [selectedExercise, setSelectedExercise] = useState<any>(null)
    const [modalVisible, setModalVisible] = useState(false)
    const [exerciseList, setExerciseList] = useState<any[]>([])

    const [editContext, setEditContext] = useState<ExerciseEditContext | null>(null)
    const [selectedExerciseName, setSelectedExerciseName] = useState('')
    const [sets, setSets] = useState('')
    const [reps, setReps] = useState('')

    useEffect(() => {
        const fetchExercises = async () => {
            const res = await exerciseService.getAll();
            setExerciseList(res);
        };

        fetchExercises();

    }, [])

    const mapDayOfWeekEngToVie = (dayOfWeekEng: string | null | undefined): string => {
        if (!dayOfWeekEng) return '';

        // Chuẩn hóa dữ liệu đầu vào: viết hoa toàn bộ và xóa khoảng trắng 2 đầu
        const cleanDay = dayOfWeekEng.trim().toUpperCase();

        const dayMap: Record<string, string> = {
            'MONDAY': 'Thứ Hai',
            'TUESDAY': 'Thứ Ba',
            'WEDNESDAY': 'Thứ Tư',
            'THURSDAY': 'Thứ Năm',
            'FRIDAY': 'Thứ Sáu',
            'SATURDAY': 'Thứ Bảy',
            'SUNDAY': 'Chủ Nhật',
        };

        return dayMap[cleanDay] || dayOfWeekEng;
    };


    const mapWorkoutLevel = (level: string | null | undefined) => {
        const cleanLevel = level?.trim().toUpperCase() || 'BEGINNER';

        const levelMap: Record<string, { text: string; textColor: string; bgColor: string }> = {
            'BEGINNER': {
                text: 'Người mới (Cơ bản)',
                textColor: 'text-green-700',
                bgColor: 'bg-green-50',
            },
            'INTERMEDIATE': {
                text: 'Trung cấp',
                textColor: 'text-blue-700',
                bgColor: 'bg-blue-50',
            },
            'ADVANCED': {
                text: 'Nâng cao (Chuyên nghiệp)',
                textColor: 'text-red-700',
                bgColor: 'bg-red-50',
            },
        };

        // Trả về giá trị map được, nếu không khớp trả về mặc định của BEGINNER
        return levelMap[cleanLevel] || levelMap['BEGINNER'];
    };

    const generateRoadmap = async () => {
        setLoading(true);
        try {
            // Lấy thời điểm hiện tại
            const tomorrow = new Date();
            // Cộng thêm 1 ngày để ra ngày mai
            tomorrow.setDate(tomorrow.getDate() + 1);

            const year = tomorrow.getFullYear();
            const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
            const day = String(tomorrow.getDate()).padStart(2, '0');

            const startDateStr = `${year}-${month}-${day}`;

            const payload = {
                traineeId: RequestItem.traineeId,
                primaryGoalId: RequestItem.primaryGoalId,
                secondaryGoalIds: RequestItem.secondaryGoalIds,
                workoutLevel: RequestItem.workoutLevel,
                trainingDays: RequestItem.trainingDays,
                startDate: startDateStr, // Truyền ngày mai vào đây
                durationWeeks: RequestItem.durationWeeks,
            };

            const res = await RoadmapServices.generateRoadmap(payload);

            console.log('generateRoadmap result', res);
            setRoadmap(res);
            setLoading(false);
        } catch (e) {
            console.error('Error generating roadmap', e);
            Alert.alert('Lỗi', 'Không thể tạo lộ trình.');
        } finally {
            setLoading(false);
        }
    };

    const openExerciseEditor = (
        stageIndex: number,
        scheduleIndex: number,
        exerciseIndex: number,
        exercise: any
    ) => {
        setEditContext({ stageIndex, scheduleIndex, exerciseIndex });
        setSelectedExerciseName(exercise.exerciseName);
        setSets(String(exercise.sets));
        setReps(String(exercise.durationSeconds ?? ''));
        setModalVisible(true);
    };

    const handleSaveExercise = () => {
        if (!editContext) return;
        const { stageIndex, scheduleIndex, exerciseIndex } = editContext;

        setRoadmap((prev: any) => {
            const newStages = [...prev.stages];
            const targetExercise = newStages[stageIndex].schedules[scheduleIndex].exercises[exerciseIndex];

            newStages[stageIndex].schedules[scheduleIndex].exercises[exerciseIndex] = {
                ...targetExercise,
                exerciseName: selectedExerciseName,
                sets: Number(sets),
                // Gán giá trị vào durationSeconds thay vì reps
                durationSeconds: Number(reps),
                reps: null // Reset reps về null vì không dùng nữa
            };

            return { ...prev, stages: newStages };
        });

        setModalVisible(false);
    };

    const scheduleMap = useMemo(() => {
        const map: Record<string, string> = {};

        RequestItem.trainingDaySchedules?.forEach((item: any) => {
            map[item.dayOfWeek] = item.startTime;
        });

        return map;
    }, [RequestItem.trainingDaySchedules]);

    const DAY_LABELS: Record<string, string> = {
        MONDAY: 'Thứ 2',
        TUESDAY: 'Thứ 3',
        WEDNESDAY: 'Thứ 4',
        THURSDAY: 'Thứ 5',
        FRIDAY: 'Thứ 6',
        SATURDAY: 'Thứ 7',
        SUNDAY: 'CN',
    };


    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* HEADER: centered title + back */}
            <View style={styles.header}>
                <Pressable onPress={() => (nav as any).goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={22} color="#333" />
                </Pressable>
                <Text style={[styles.headerTitle, styles.headerTitleCenter]}>{'Thông tin học viên'}</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView className="flex-1 p-4" contentContainerStyle={styles.scrollContent}>
                <View className="bg-white mx-4 mb-4 p-5 pb-2 rounded-3xl shadow-sm border-2 border-secondaryText/40">

                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-3">

                        <View className="flex-row items-center">

                            <Image
                                source={
                                    RequestItem.traineeAvatarUrl
                                        ? { uri: RequestItem.traineeAvatarUrl }
                                        : require('../../../assets/placeholderAvatar.png')
                                }
                                className="w-12 h-12 rounded-full mr-3"
                            />

                            <View>
                                <Text className="text-lg font-bold text-gray-800">
                                    {RequestItem.traineeFullName}
                                </Text>

                                <Text className="text-md text-gray-400">
                                    {RequestItem.durationWeeks} tuần tập luyện
                                </Text>
                            </View>

                        </View>


                    </View>

                    {/* Goal */}
                    <View className="bg-amber-50 p-3 rounded-xl mb-3">
                        <Text className="text-amber-700 font-bold text-2xl">
                            🎯 {RequestItem.primaryGoalName}
                        </Text>
                    </View>

                    <View className="bg-amber-50 p-3 rounded-xl mb-3">
                        <Text className="text-amber-700 font-normal">
                            🎯 {RequestItem.secondaryGoalNames.join(', ')}
                        </Text>
                    </View>

                    {/* Level */}
                    <View className="flex-row items-center mb-3">

                        <Ionicons name="barbell-outline" size={18} color="#6B7280" />

                        <Text className="ml-2 text-gray-700">
                            Cấp độ:{' '}
                            <Text className="font-semibold text-amber-950">
                                {mapWorkoutLevel(RequestItem?.workoutLevel).text}
                            </Text>
                        </Text>

                    </View>

                    {/* Training Days */}
                    <View className="flex-row flex-wrap">

                        {RequestItem.trainingDays.map((day: string) => (
                            <View
                                key={day}
                                className="bg-emerald-100 px-3 py-2 rounded-xl mr-2 mb-2 items-center"
                            >
                                <Text className="text-emerald-700 text-xs font-semibold">
                                    {DAY_LABELS[day]}
                                </Text>

                                <Text className="text-emerald-900 text-sm font-bold">
                                    🕒 {scheduleMap[day] || '--:--'}
                                </Text>
                            </View>
                        ))}

                    </View>
                </View>
                {/* HEADER SUMMARY */}
                <View className="bg-white rounded-xl p-4 mb-4 flex-row items-center">
                    <View className="flex-1">
                        <Text className="text-lg font-semibold">{parsed.source ? `Nguồn: ${parsed.source}` : 'Hồ sơ sức khỏe'}</Text>
                        <Text className="text-sm text-gray-500 mt-1">{parsed.createdAt ? new Date(parsed.createdAt).toLocaleString() : ''}</Text>
                        <Text className="text-sm text-gray-700 mt-2">Chiều cao: {parsed.height ?? parsed.measurements?.height_est ?? '-'} cm   Cân nặng: {parsed.weight ?? parsed.measurements?.weight_est ?? '-'} kg</Text>
                    </View>
                    <View className="ml-3 items-center">
                        <View className="bg-amber-50 rounded-full w-16 h-16 items-center justify-center">
                            <Text className="text-amber-700 font-bold">{parsed.bodyFat ? `${parsed.bodyFat}%` : (parsed.bmi ? `BMI ${parsed.bmi}` : '—')}</Text>
                        </View>
                    </View>
                </View>

                {/* SILHOUETTE CARD (unchanged)*/}
                <View className="bg-white rounded-xl p-4 items-center mb-4">
                    <View className="w-64 h-80 items-center justify-center">
                        <BodySilhouetteOverlay mode="front" />
                        <Image source={require('../../../assets/bodygram.png')} className="w-full h-full" resizeMode="contain" />
                        {/* measurement bubbles (unchanged) */}
                        <View className="absolute top-8 left-3">
                            <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
                                <Text className="text-xs text-gray-800">Ngực</Text>
                                <Text className="text-lg font-extrabold">{display.bust ?? '-'}cm</Text>
                            </View>
                        </View>
                        <View className="absolute top-24 left-4">
                            <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
                                <Text className="text-xs text-gray-800">Eo</Text>
                                <Text className="text-lg font-extrabold">{display.waist ?? '-'}cm</Text>
                            </View>
                        </View>
                        <View className="absolute top-24 right-4">
                            <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
                                <Text className="text-xs text-gray-800">Hông</Text>
                                <Text className="text-lg font-extrabold">{display.hip ?? '-'}cm</Text>
                            </View>
                        </View>
                        <View className="absolute bottom-9 left-7">
                            <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
                                <Text className="text-xs text-gray-800">Đùi</Text>
                                <Text className="text-lg font-extrabold">{display.thigh ?? '-'}cm</Text>
                            </View>
                        </View>
                        <View className="absolute top-9 right-7">
                            <View className="bg-amber-200 rounded-lg px-3 py-2 shadow">
                                <Text className="text-xs text-gray-800">Bắp tay</Text>
                                <Text className="text-lg font-extrabold">{display.bicep ?? '-'}cm</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* HEALTH CARD */}
                <View className="bg-amber-100 rounded-xl p-4 mb-4">
                    <Text className="text-base font-semibold mb-2">Chỉ số sức khỏe</Text>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-sm text-gray-700">Tỷ lệ eo trên hông</Text>
                        <Text className="text-xl font-extrabold">{whr ?? '-'}</Text>
                    </View>
                </View>


                {roadmap && (
                    <ScrollView className="flex-1 p-4">

                        <Text className="text-2xl font-bold mb-2">
                            {roadmap?.title}
                        </Text>

                        <Text className="text-gray-600 mb-4">
                            {roadmap?.description}
                        </Text>

                        {roadmap?.stages?.map((stage: any, stageIndex: number) => (

                            <View key={stageIndex} style={styles.stageCard} className='bg-background-sub1'>

                                {/* Stage header */}
                                <View style={styles.stageHeader}>

                                    <View style={styles.stageDot} />

                                    <Text style={styles.stageTitle}>
                                        {stage.stageName}
                                    </Text>

                                </View>

                                <Text style={styles.stageDescription}>
                                    {stage.description}
                                </Text>

                                <Text style={styles.stageDuration}>
                                    {stage.durationWeeks} tuần
                                </Text>

                                {/* schedules */}
                                {stage.schedules.map((schedule: any, scheduleIndex: number) => (

                                    <View key={scheduleIndex} style={styles.scheduleCard}>
                                        <View style={styles.scheduleHeader}>

                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                                                <Ionicons name="calendar-outline" size={18} color="#10B981" />

                                                <Text style={styles.scheduleTitle}>
                                                    {schedule.scheduleName}
                                                </Text>

                                            </View>



                                        </View>
                                        <Text style={styles.scheduleMeta}>
                                            {mapDayOfWeekEngToVie(schedule.dayOfWeek)} • {schedule.durationMinutes} phút
                                        </Text>
                                        {/* exercises */}
                                        {schedule.exercises.map((ex: any, exerciseIndex: number) => (

                                            <Pressable
                                                key={ex.exerciseOrder}
                                                onPress={() =>
                                                    openExerciseEditor(
                                                        stageIndex,
                                                        scheduleIndex,
                                                        exerciseIndex,
                                                        ex
                                                    )
                                                }
                                                style={styles.exerciseRow}
                                                className='flex-wrap'
                                            >

                                                <View style={styles.exerciseLeft} className='w-full'>
                                                    <View style={styles.exerciseOrder}>
                                                        <Text style={styles.exerciseOrderText}>
                                                            {ex.exerciseOrder}
                                                        </Text>
                                                    </View>

                                                    <Text style={styles.exerciseName}>
                                                        {ex.exerciseName}
                                                    </Text>
                                                </View>

                                                <View style={styles.exerciseMeta} className='w-full pt-2'>
                                                    <Text style={styles.exerciseBadge}>
                                                        {ex.sets} sets
                                                    </Text>

                                                    <Text style={styles.exerciseBadge}>
                                                        {ex.durationSeconds ?? 0}s
                                                    </Text>

                                                    <View className='flex-grow' />
                                                    <Ionicons name="create-outline" size={18} color="#9CA3AF" />
                                                </View>

                                            </Pressable>

                                        ))}

                                    </View>

                                ))}

                            </View>

                        ))}

                    </ScrollView>

                )}

                {loading ? <LoadingOverlay /> : null}
                <Toast visible={toastVisible} message={toastMsg} type={toastType} onHidden={() => setToastVisible(false)} />

            </ScrollView>

            {/* Fixed footer with Save button */}
            <View style={styles.footer}>
                {!roadmap ? (
                    <Pressable
                        onPress={generateRoadmap}
                        style={styles.saveBtn}
                        disabled={loading}
                    >
                        <Text style={styles.saveBtnText}>
                            Tạo lộ trình bằng AI
                        </Text>
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={saveRoadmap}
                        style={styles.saveBtn}
                        disabled={loading}
                    >
                        <Text style={styles.saveBtnText}>
                            Lưu và gửi cho học viên
                        </Text>
                    </Pressable>
                )}
            </View>

            <Modal visible={modalVisible} transparent animationType="slide">

                <View style={styles.bottomSheetBackdrop}>

                    <View style={styles.bottomSheet}>

                        <View style={styles.sheetHandle} />

                        <Text style={styles.sheetTitle}>
                            Chỉnh sửa bài tập
                        </Text>

                        <Text style={styles.sheetLabel}>Bài tập</Text>

                        <View className="border border-gray-300 rounded-lg bg-white overflow-hidden w-full my-2 justify-center">
                            <Picker
                                selectedValue={selectedExerciseName}
                                onValueChange={(v) => setSelectedExerciseName(v)}
                                // Ép chiều cao cố định trực tiếp bằng style (Thông thường từ 45px đến 55px tùy thiết kế)
                                style={{
                                    height: 50,
                                    width: '100%',
                                    backgroundColor: '#ffffff',
                                    color: '#111827' // Đổi màu chữ hiển thị sau khi chọn trên Android
                                }}
                                // Trên Android, chế độ 'dropdown' giúp hiển thị gọn gàng và không bị lỗi đè chữ
                                mode="dropdown"
                            >
                                {exerciseList.map((ex) => (
                                    <Picker.Item
                                        key={ex.id}
                                        label={ex.name}
                                        value={ex.name}

                                    />
                                ))}
                            </Picker>
                        </View>

                        {/* Trong Modal UI */}
                        <View style={styles.rowInputs}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sheetLabel}>Số hiệp (Sets)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={sets}
                                    onChangeText={setSets}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.sheetLabel}>Thời gian (Giây)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={reps} // Vẫn dùng biến reps cũ nhưng nhãn là Thời gian
                                    onChangeText={setReps}
                                    keyboardType="numeric"
                                    placeholder="Ví dụ: 30"
                                />
                            </View>
                        </View>

                        <View style={styles.sheetButtons}>

                            <Pressable
                                style={styles.cancelBtn}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text>Huỷ</Text>
                            </Pressable>

                            <Pressable
                                style={styles.saveBtnModal}
                                onPress={handleSaveExercise}
                            >
                                <Text style={{ color: '#fff', fontWeight: '700' }}>
                                    Lưu thay đổi
                                </Text>
                            </Pressable>

                        </View>

                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
    headerButton: { padding: 8 },
    headerButtonText: { color: '#333' },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    headerTitleCenter: { textAlign: 'center', flex: 1 },
    scrollContent: { paddingBottom: 140 },
    footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'transparent' },
    saveBtn: { backgroundColor: '#b5651d', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '700' },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 10,
        marginTop: 10
    },

    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)'
    },

    modalCard: {
        backgroundColor: '#fff',
        width: '90%',
        padding: 20,
        borderRadius: 14
    },

    modalTitle: {
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 12
    },
    stageCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6
    },

    stageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6
    },

    stageDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10B981',
        marginRight: 8
    },

    stageTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#065F46'
    },

    stageDescription: {
        color: '#6B7280',
        marginBottom: 6
    },

    stageDuration: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 12
    },

    scheduleCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 14
    },

    scheduleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },

    scheduleTitle: {
        marginLeft: 6,
        fontWeight: '600'
    },

    scheduleMeta: {
        fontSize: 12,
        color: '#9CA3AF'
    },

    exerciseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB'
    },

    exerciseLeft: {
        flexDirection: 'row',
        alignItems: 'center'
    },

    exerciseOrder: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10
    },

    exerciseOrderText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12
    },

    exerciseName: {
        fontWeight: '500',
        color: '#374151'
    },

    exerciseMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },

    exerciseBadge: {
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        fontSize: 11
    },

    bottomSheetBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)'
    },

    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20
    },

    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D5DB',
        alignSelf: 'center',
        borderRadius: 2,
        marginBottom: 12
    },

    sheetTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10
    },

    sheetLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 10
    },

    rowInputs: {
        flexDirection: 'row',
        gap: 10
    },

    sheetButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20
    },

    cancelBtn: {
        padding: 12
    },

    saveBtnModal: {
        backgroundColor: '#10B981',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10
    }
});
