import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { RNMediapipe } from '@thinksys/react-native-mediapipe';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { LABELS, SCALER_MEAN, SCALER_SCALE, ExerciseType } from '../../hooks/poseModel';
import { useSoundManager } from './useSoundManager';
export default function AITracking() {
    const plugin = useTensorflowModel(require('../../assets/pose_correction_exercise_aware.tflite'));
    const model = plugin.model;
    const { loadSounds, play } = useSoundManager();
    const [feedback, setFeedback] = useState({ status: 'Ready', detail: 'Đang đợi dữ liệu...' });
    const isProcessing = useRef(false);

    const argMax = (array: Float32Array) => {
        return array.reduce((iMax, x, i, arr) => (x > arr[iMax] ? i : iMax), 0);
    };

    useEffect(() => {
        loadSounds();

        setTimeout(() => {
            console.log("TEST PLAY");
            play("Lower_Back");
        }, 3000);
    }, []);

    const handlePose = useCallback(async (data: any) => {
        if (!data?.landmarks || !model) {
            setFeedback({ status: '⚠️ LỖI', detail: 'Dữ liệu đầu vào không hợp lệ hoặc model chưa sẵn sàng' });
            return;
        }
        if (isProcessing.current) {
            return;
        }

        try {
            isProcessing.current = true;

            setFeedback(prev => ({ ...prev, status: '⚙️ Đang phân tích...' }));

            /* ================================
               1️⃣ BUILD & SCALE KEYPOINT ARRAY
            ================================= */

            const posePoints = data.landmarks;
            if (posePoints.length < 33) return;

            const kpArray = new Float32Array(132);

            for (let i = 0; i < 33; i++) {
                const lm = posePoints[i];
                const base = i * 4;

                const rawValues = [
                    lm.x ?? 0,
                    lm.y ?? 0,
                    lm.z ?? 0,
                    lm.visibility ?? 0
                ];

                for (let j = 0; j < 4; j++) {
                    const mean = SCALER_MEAN[base + j] ?? 0;
                    const scale = SCALER_SCALE[base + j] ?? 1;

                    // Avoid divide by zero
                    const safeScale = scale === 0 ? 1 : scale;

                    kpArray[base + j] = (rawValues[j] - mean) / safeScale;
                }
            }

            /* ================================
               2️⃣ BUILD EXERCISE ONE-HOT
            ================================= */

            const exArray = new Float32Array(8).fill(0);

            const exIdx = LABELS.exercises.indexOf("plank"); // hoặc dynamic từ UI
            if (exIdx !== -1) {
                exArray[exIdx] = 1;
            } else {
                console.warn("Exercise không tồn tại trong label_mappings");
                return;
            }

            /* ================================
               3️⃣ RUN INFERENCE
            ================================= */

            const outputs = await model.run([exArray, kpArray]);

            if (!outputs || outputs.length < 3) {
                throw new Error("Model output không hợp lệ");
            }

            // TFLite thường trả Float32Array trực tiếp
            const bodyPartOutput = outputs[0] as Float32Array; // [1,11]
            const labelOutput = outputs[1] as Float32Array;    // [1,1]
            const sideOutput = outputs[2] as Float32Array;     // [1,3]

            const incorrectProb = labelOutput[0];

            /* ================================
               4️⃣ PARSE RESULT
            ================================= */

            if (incorrectProb < 0.5) {
                setFeedback({
                    status: '✅ CHUẨN',
                    detail: `Tư thế chính xác (${(1 - incorrectProb).toFixed(2)})`
                });
            } else {

                const argMax = (arr: Float32Array) => {
                    let max = arr[0];
                    let idx = 0;
                    for (let i = 1; i < arr.length; i++) {
                        if (arr[i] > max) {
                            max = arr[i];
                            idx = i;
                        }
                    }
                    return idx;
                };

                const partIdx = argMax(bodyPartOutput);
                const sideIdx = argMax(sideOutput);

                setFeedback({
                    status: '❌ CẦN SỬA',
                    detail: `${LABELS.body_parts[partIdx]} (${LABELS.sides[sideIdx]})`,
                });

                const partName = LABELS.body_parts[partIdx].toLowerCase();
                const soundKey = partName.replace(" ", "");
                play(soundKey);
            }

        } catch (error) {
            console.error("❌ LỖI KHI CHẠY AI:", error);
            setFeedback({
                status: '⚠️ LỖI',
                detail: 'Inference thất bại'
            });
        } finally {
            isProcessing.current = false;
        }

    }, [model]);

    const handlePoseRef = useRef(handlePose);

    // 2. Cập nhật Ref mỗi khi model hoặc hàm thay đổi
    useEffect(() => {
        handlePoseRef.current = handlePose;
    }, [handlePose]);

    if (plugin.state === 'loading') {
        return (
            <View className="flex-1 justify-center items-center bg-black">
                <ActivityIndicator size="large" color="#10b981" />
                <Text className="text-white mt-4">Đang tải trí tuệ nhân tạo...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <RNMediapipe
                style={{ flex: 1, width: '100%', height: '100%' }}
                onLandmark={(data) => {
                    const parsed =
                        typeof data === "string"
                            ? JSON.parse(data)
                            : data;

                    handlePoseRef.current(parsed);
                }}
            />

            <View className="absolute bottom-10 left-5 right-5">
                <View className={`p-5 rounded-3xl border-2 bg-black/80 ${feedback.status.includes('❌') ? 'border-red-500' : 'border-emerald-500'}`}>
                    <Text className={`text-2xl font-bold text-center ${feedback.status.includes('❌') ? 'text-red-500' : 'text-emerald-500'}`}>
                        {feedback.status}
                    </Text>
                    <Text className="text-white text-center text-base mt-2 font-medium">
                        {feedback.detail}
                    </Text>
                </View>
            </View>

            <View className="absolute top-14 left-5 bg-emerald-500/20 px-4 py-2 rounded-full border border-emerald-500/50">
                <Text className="text-emerald-400 font-bold uppercase tracking-widest text-xs">AI Tracking Active</Text>
            </View>
        </View>
    );
}