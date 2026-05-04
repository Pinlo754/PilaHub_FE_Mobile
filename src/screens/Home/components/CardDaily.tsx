import Ionicons from '@react-native-vector-icons/ionicons';
import React from 'react';
import { Image, Text, View } from 'react-native';

import { colors } from '../../../theme/colors';
import { DailyTaskItem } from '../../../hooks/dailyTask.service';

type Props = {
  item?: DailyTaskItem;
};

const getIconName = (type?: DailyTaskItem['type']) => {
  switch (type) {
    case 'BOOKING':
      return 'calendar-outline';
    case 'ROADMAP':
      return 'barbell-outline';
    case 'COURSE':
      return 'book-outline';
    default:
      return 'list-outline';
  }
};

const getTypeLabel = (type?: DailyTaskItem['type']) => {
  switch (type) {
    case 'BOOKING':
      return 'Lịch hẹn';
    case 'ROADMAP':
      return 'Lộ trình';
    case 'COURSE':
      return 'Khóa học';
    default:
      return 'Nhiệm vụ';
  }
};

const getStyleByType = (type?: DailyTaskItem['type']) => {
  switch (type) {
    case 'BOOKING':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        iconBg: 'bg-blue-100',
        iconColor: '#2563EB',
      };

    case 'ROADMAP':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        iconBg: 'bg-orange-100',
        iconColor: colors.background.DEFAULT,
      };

    case 'COURSE':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        iconBg: 'bg-purple-100',
        iconColor: '#9333EA',
      };

    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        iconBg: 'bg-gray-100',
        iconColor: colors.secondaryText,
      };
  }
};

const CardDaily = ({ item }: Props) => {
  if (!item || !item.type) {
    return null;
  }

  const style = getStyleByType(item.type);

  return (
    <View
      className="w-[245px] rounded-3xl bg-white p-4 ml-2"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}
    >
      <View className="flex-row items-center">
        <View
          className={`w-12 h-12 rounded-2xl ${style.iconBg} items-center justify-center overflow-hidden`}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name={getIconName(item.type)}
              size={23}
              color={style.iconColor}
            />
          )}
        </View>

        <View className="ml-3 flex-1">
          <View className={`self-start px-2.5 py-1 rounded-full ${style.bg}`}>
            <Text className={`text-xs font-bold ${style.text}`}>
              {getTypeLabel(item.type)}
            </Text>
          </View>

          <Text
            numberOfLines={1}
            className="mt-1 text-sm font-semibold color-secondaryText"
          >
            {item.time || 'Hôm nay'}
          </Text>
        </View>

       
      </View>

      <Text
        numberOfLines={2}
        className="mt-4 text-base font-bold color-foreground leading-5 min-h-[40px]"
      >
        {item.title}
      </Text>

      <Text
        numberOfLines={2}
        className="mt-1 text-sm color-secondaryText leading-5 min-h-[38px]"
      >
        {item.subtitle || 'Nhiệm vụ trong ngày'}
      </Text>

      <View className="flex-row items-center justify-between mt-4">
        <View
          className={`px-3 py-1.5 rounded-full ${
            item.completed ? 'bg-emerald-50' : 'bg-slate-100'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              item.completed ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            {item.completed ? 'Hoàn thành' : 'Chưa xong'}
          </Text>
        </View>

        <Text className="text-xs color-secondaryText">Hôm nay</Text>
      </View>
    </View>
  );
};

export default CardDaily;