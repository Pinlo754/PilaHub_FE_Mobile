import { ApiResponse } from '../utils/ApiResType';
import { CardItem } from '../utils/DailyTaskType';
import api from './axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const mockApi = {
  getSchedules: async (): Promise<CardItem[]> => {
    const id = await AsyncStorage.getItem('id').then((val) =>
      val?.replace(/"/g, '')
    );

    const res = await api.get<any[]>(
      `https://69a75f542cd1d055269087ae.mockapi.io/Schedule?trainee=${id}`
    );

    const mapped: CardItem[] = res.data.map((item) => ({
      id: item.id,
      type: item.type ?? 'course', // default nếu API không có
      title: item.title,
      session: Number(item.session) || 0,
      duration: item.duration,
      thumbnail_url: item.thumbnail_url,
    }));

    return mapped;
  },
};