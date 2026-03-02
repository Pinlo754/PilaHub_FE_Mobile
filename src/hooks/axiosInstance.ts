import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://192.168.100.100:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(async config => {
  // const token = await AsyncStorage.getItem('accessToken');
  const token = 'eyJhbGciOiJIUzUxMiJ9.eyJhY2NvdW50SWQiOiI3N2JiZWZhNS02MTczLTRmNDUtODZkZC0yZTZlOTg5NDBhOTQiLCJyb2xlIjoiQURNSU4iLCJ0eXBlIjoiYWNjZXNzIiwic3ViIjoiYWRtaW5AcGlsYS5jb20iLCJpYXQiOjE3NzI0ODIxNzgsImV4cCI6MTc3MjU2ODU3OH0.JD7j65513Mm9D2GwUPLZqGhyO0O_KxlucUN15whtw_lVY5W311yLDPxXN_sDNrV_u5w5tfI4VeoDX1aSvHS_DQ';

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
export default api;
