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
  const token = 'eyJhbGciOiJIUzUxMiJ9.eyJhY2NvdW50SWQiOiI3N2JiZWZhNS02MTczLTRmNDUtODZkZC0yZTZlOTg5NDBhOTQiLCJyb2xlIjoiQURNSU4iLCJ0eXBlIjoiYWNjZXNzIiwic3ViIjoiYWRtaW5AcGlsYS5jb20iLCJpYXQiOjE3NzI1MTgzMTcsImV4cCI6MTc3MjYwNDcxN30.xqZ8DgKyHVEnYc-pOfne9dFbwv9xaX_D7XXWCeicRZWw-fnkncVkOmqbyRwafiWNtF5A5YP5KDJ9JL4FYeoF4A';

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
export default api;
