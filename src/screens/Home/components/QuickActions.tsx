import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { colors } from '../../../theme/colors';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';

type ActionItem<RouteName extends keyof RootStackParamList> = {
  id: string;
  title: string;
  icon: string;
  size: number;
  bgColor: string;
  iconColor: string;
  route: RouteName;
};

const ACTIONS: ActionItem<keyof RootStackParamList>[] = [
  {
    id: 'roadmap',
    title: 'Tạo lộ trình',
    icon: 'git-network',
    size: 22,
    bgColor: colors.success[20],
    iconColor: colors.success.DEFAULT,
    route: 'RoadmapSummary',
  },
  {
    id: 'ai',
    title: 'Đăng ký AI',
    icon: 'sparkles',
    size: 18,
    bgColor: colors.info[20],
    iconColor: colors.info.darker,
    route: 'Roadmap',
  },
  {
    id: 'calendar',
    title: 'Đăng ký lịch',
    icon: 'calendar',
    size: 22,
    bgColor: colors.warning[20],
    iconColor: colors.warning.DEFAULT,
    route: 'Roadmap',
  },
  {
    id: 'video',
    title: 'Video call',
    icon: 'videocam',
    size: 23,
    bgColor: colors.purple[20],
    iconColor: colors.purple.DEFAULT,
    route: 'Roadmap',
  },
];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const QuickActions = ({ navigation }: Props) => {
  return (
    <View className="flex-row flex-wrap gap-2 px-4 mb-4">
      {ACTIONS.map(item => (
        <Pressable
          key={item.id}
          onPress={() => navigation.navigate(item.route as any)}
          className="w-[49%] bg-white rounded-xl p-4 flex-row items-center shadow-sm elevation-6 border border-background-sub1_30"
        >
          <View
            style={{ backgroundColor: item.bgColor }}
            className="w-11 h-11 rounded-lg items-center justify-center mr-3"
          >
            <Ionicons
              name={item.icon as any}
              size={item.size}
              color={item.iconColor}
            />
          </View>

          <Text className="text-lg font-semibold text-foreground">
            {item.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

export default QuickActions;
