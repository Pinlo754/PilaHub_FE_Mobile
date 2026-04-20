import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../theme/colors';
import ProgressCircle from '../../../components/ProgressCircle';
import axios from '../../../hooks/axiosInstance';
import { useNavigation } from '@react-navigation/native';

const RoadmapProgress = () => {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState<string>('');
  const [percent, setPercent] = useState<number>(0);
  const [roadmap, setRoadmap] = useState<any | null>(null);
  const [hasRoadmap, setHasRoadmap] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const fetchNewest = async () => {
      try {
        const res = await axios.get('/roadmaps/newest');
        const newestData = res.data?.data ?? res.data ?? res;
        const roadmapFromServer = newestData?.roadmap ?? newestData ?? null;

        if (roadmapFromServer && mounted) {
          const t = roadmapFromServer?.title ?? roadmapFromServer?.name ?? 'Lộ trình của tôi';
          const p = Number(roadmapFromServer?.progressPercent ?? roadmapFromServer?.progress ?? 0);

          setTitle(t);
          if (!Number.isNaN(p)) setPercent(Math.max(0, Math.min(100, p)));
          setRoadmap(roadmapFromServer);
          setHasRoadmap(true);
        } else if (mounted) {
          // no roadmap available
          setRoadmap(null);
          setHasRoadmap(false);
          setTitle('');
          setPercent(0);
        }
      } catch (err) {
        console.warn('RoadmapProgress fetchNewest error', err);
      }
    };

    fetchNewest();

    return () => {
      mounted = false;
    };
  }, []);

  if (!hasRoadmap) {
    return (
      <Pressable
        onPress={() => navigation.navigate('CreateRoadmap')}
        className="m-4 p-4 rounded-xl bg-white border border-background-sub1_30 elevation-md shadow-md flex-row justify-between items-center gap-6"
      >
        <View className="flex-1 pr-2">
          <View className="flex-row gap-2 items-center">
            <Ionicons name="barbell-outline" size={24} color={colors.foreground} />
            <Text className="color-secondaryText font-medium">Lộ trình của tôi</Text>
          </View>
          <Text className="color-foreground font-semibold text-lg mt-2">Bạn chưa có lộ trình</Text>
          <Text className="text-sm text-gray-500 mt-1">Khám phá các lộ trình phù hợp để bắt đầu</Text>
        </View>
        <View>
          <View className="bg-amber-50 px-3 py-2 rounded-full">
            <Text className="text-amber-700 font-semibold">Khám phá</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => navigation.navigate('Roadmap')}
      className="m-4 p-4 rounded-xl bg-white border border-background-sub1_30 elevation-md shadow-md flex-row justify-between items-center gap-6"
    >
      {/* Left section */}
      <View className="flex-1 pr-2">
        <View className="flex-row gap-2 items-center">
          <Ionicons name="barbell-outline" size={24} color={colors.foreground} />
          <Text className="color-secondaryText font-medium">Lộ trình của tôi</Text>
        </View>

        <Text numberOfLines={1} ellipsizeMode="tail" className="color-foreground font-semibold text-lg mt-1">
          {title}
        </Text>
      </View>

      {/* Progress */}
      <View style={{ width: 72, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <ProgressCircle size={50} strokeWidth={5} bgColor={colors.inactive.lighter} progressColor={colors.foreground} percent={percent} />
        <View className="absolute inset-0 items-center justify-center">
          <Text className="color-foreground font-semibold">{percent}%</Text>
        </View>
      </View>
    </Pressable>
  );
};

export default RoadmapProgress;
