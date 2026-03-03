import React, { useState } from "react";
import {  ScrollView, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useRoadmapStore } from "../../store/roadmap.store";

import StageSelector from "./components/StageSelector";
import SupplementSection from "./components/SupplementSection";
import StageCalendar from "./components/StageCalendar";
import ScheduleDetail from "./components/ScheduleDetail";
import BottomActionBar from "./components/BottomActionBar";
import { SafeAreaView } from "react-native-safe-area-context";

const PlanScreen = () => {
  const route: any = useRoute();
  const storeList = useRoadmapStore((s) => s.list);

  const roadmap =
    route.params?.roadmap ?? storeList?.[0]?.roadmap ?? null;
  const stages =
    route.params?.stages ?? storeList?.[0]?.stages ?? [];

  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (!roadmap || !stages?.length) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Không có dữ liệu lộ trình</Text>
      </SafeAreaView>
    );
  }

  const selectedStage = stages[selectedStageIndex];

  const selectedSchedule =
    selectedStage?.schedules?.find((s: any) =>
      selectedDate
        ? s.scheduledDate?.startsWith(selectedDate)
        : false
    ) ?? null;

  return (
    <SafeAreaView className="flex-1 bg-[#F3EDE3]">
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Header */}
        <View className="px-5 mt-4">
          <Text className="text-2xl font-bold text-[#8B4513]">
            {roadmap.title}
          </Text>
          {roadmap.description && (
            <Text className="text-gray-600 mt-2">
              {roadmap.description}
            </Text>
          )}
        </View>

        {/* Stage selector */}
        <StageSelector
          stages={stages}
          selectedIndex={selectedStageIndex}
          onSelect={(i: number) => {
            setSelectedStageIndex(i);
            setSelectedDate(null);
          }}
        />

        {/* Calendar */}
        <StageCalendar
          stage={selectedStage}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Schedule detail */}
        <ScheduleDetail schedule={selectedSchedule} />

        {/* Supplement */}
        <SupplementSection stage={selectedStage} />
      </ScrollView>

      <BottomActionBar />
    </SafeAreaView>
  );
};

export default PlanScreen;