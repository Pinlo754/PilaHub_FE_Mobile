import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

interface AISessionListViewProps {
  sessions: any[];
  onSelectSession: (session: any) => void;
}

const AISessionListView: React.FC<AISessionListViewProps> = ({ sessions, onSelectSession }) => {
  if (!sessions || sessions.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Ionicons name="information-circle-outline" size={48} color="#9CA3AF" />
        <Text className="text-gray-400 text-center mt-4">Không có bài tập AI nào</Text>
      </View>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return '#D1FAE5';
    if (score >= 60) return '#FEF3C7';
    return '#FEE2E2';
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View className="mx-4 mt-4">
        <Text className="text-xl font-bold text-[#3A2A1A] mb-4">
          Kết quả AI Tracking ({sessions.length} bài)
        </Text>

        {sessions.map((session, index) => (
          <TouchableOpacity
            key={session.workoutSessionId || index}
            activeOpacity={0.7}
            onPress={() => onSelectSession(session)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm mb-3 overflow-hidden"
          >
            <View className="flex-row p-4 items-center">
              {/* Exercise Image */}
              <Image
                source={{
                  uri: session.imageUrl || session.image || 'https://via.placeholder.com/64',
                }}
                className="w-16 h-16 rounded-lg bg-gray-100"
                resizeMode="cover"
              />

              {/* Exercise Info */}
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold text-[#3A2A1A]">
                  {index + 1}. {session.exerciseName}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  {new Date(session.startTime).toLocaleDateString('vi-VN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {/* Score */}
              {session.feedback && (
                <View
                  style={{
                    backgroundColor: getScoreBgColor(session.feedback.overallScore),
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    marginLeft: 12,
                  }}
                >
                  <Text
                    style={{
                      color: getScoreColor(session.feedback.overallScore),
                      fontWeight: 'bold',
                      fontSize: 16,
                    }}
                  >
                    {session.feedback.overallScore}
                  </Text>
                </View>
              )}

              {/* Arrow Icon */}
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#9CA3AF"
                style={{ marginLeft: 8 }}
              />
            </View>

            {/* Feedback Summary */}
            {session.feedback && (
              <View className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                <View className="flex-row justify-between mb-2">
                  <View>
                    <Text className="text-xs text-gray-500">Form Score</Text>
                    <Text className="text-sm font-semibold text-[#8B4513]">
                      {session.feedback.formScore}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-gray-500">Endurance</Text>
                    <Text className="text-sm font-semibold text-[#8B4513]">
                      {session.feedback.enduranceScore}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-gray-500">Mistakes</Text>
                    <Text className="text-sm font-semibold text-red-600">
                      {session.feedback.totalMistakes}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
};

export default AISessionListView;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
});
