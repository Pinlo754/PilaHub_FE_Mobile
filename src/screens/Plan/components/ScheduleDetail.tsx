import { View, Text } from "react-native";

export default function ScheduleDetail({ schedule }: any) {
  if (!schedule) return null;

  return (
    <View className="bg-white mx-5 mt-5 p-4 rounded-2xl shadow">
      <Text className="text-lg font-bold">
        {schedule.scheduleName}
      </Text>

      <Text className="text-gray-500 mt-1">
        {schedule.dayOfWeek} • {schedule.durationMinutes} phút
      </Text>

      {schedule.exercises?.map((ex: any, i: number) => (
        <View key={i} className="mt-3 border-t border-gray-100 pt-3">
          <Text className="font-semibold">
            {ex.exerciseName}
          </Text>
          <Text className="text-gray-500 text-sm">
            {ex.sets} x {ex.reps ?? "-"}{" "}
            {ex.durationSeconds
              ? `• ${ex.durationSeconds}s`
              : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}