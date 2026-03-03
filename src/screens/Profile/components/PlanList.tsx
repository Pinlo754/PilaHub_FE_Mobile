import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const styles = StyleSheet.create({
  flex1: { flex: 1 },
});

type Plan = {
  title: string;
  subtitle?: string;
  sessions?: string;
  duration?: string;
  frequency?: string;
  coach?: string;
};

type Props = {
  plans: Plan[];
  onOpen?: (p: Plan) => void;
};

export default function PlanList({ plans, onOpen }: Props) {
  return (
    <View className="mt-4">
      {plans.map((p, idx) => (
        <View key={idx} className="bg-white rounded-lg p-4 mb-3 shadow">
          <View className="flex-row justify-between items-start">
            <View style={styles.flex1}>
              <Text className="font-semibold text-base">{p.title}</Text>
              {p.subtitle ? <Text className="text-sm text-gray-500 mt-1">{p.subtitle}</Text> : null}

              <View className="flex-row flex-wrap mt-3">
                {p.sessions ? (
                  <View className="flex-row items-center mr-4 mb-2">
                    <Ionicons name="calendar-outline" size={16} color="#A0522D" />
                    <Text className="ml-2 text-sm text-gray-600">{p.sessions}</Text>
                  </View>
                ) : null}

                {p.duration ? (
                  <View className="flex-row items-center mr-4 mb-2">
                    <Ionicons name="time-outline" size={16} color="#A0522D" />
                    <Text className="ml-2 text-sm text-gray-600">{p.duration}</Text>
                  </View>
                ) : null}

                {p.frequency ? (
                  <View className="flex-row items-center mr-4 mb-2">
                    <Ionicons name="repeat-outline" size={16} color="#A0522D" />
                    <Text className="ml-2 text-sm text-gray-600">{p.frequency}</Text>
                  </View>
                ) : null}

                {p.coach ? (
                  <View className="flex-row items-center mr-4 mb-2">
                    <Ionicons name="person-outline" size={16} color="#A0522D" />
                    <Text className="ml-2 text-sm text-gray-600">{p.coach}</Text>
                  </View>
                ) : null}

                <View className="flex-row items-center mr-4 mb-2">
                  <Ionicons name="bar-chart-outline" size={16} color="#A0522D" />
                  <Text className="ml-2 text-sm text-gray-600">Tiến độ: 0%</Text>
                </View>
              </View>
            </View>

            <Pressable onPress={() => onOpen?.(p)} className="px-3 py-2 bg-amber-100 rounded-lg ml-3">
              <Text className="text-amber-800">Mở</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}
