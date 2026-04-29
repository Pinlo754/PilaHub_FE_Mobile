import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  // baseURL: 'http://192.168.1.4:8080/api',
  //baseURL:'http://10.87.51.21:8080/api', //fpt student wifi
  // baseURL:'http://192.168.1.10:8080/api', //Wifi Pinlo nè
  baseURL: 'https://api.pilahub.io.vn/api', //prod
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
export default api;
