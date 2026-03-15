import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
    // baseURL: 'http://192.168.1.4:8080/api',
    //baseURL:'http://10.87.51.21:8080/api', //fpt student wifi
    //baseURL:'http://10.132.216.46:8080/api', //Wifi Pinlo nè
    baseURL:'http://192.168.1.7:8080/api', //wifi Pinlo
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('accessToken');
  // const token = 'eyJhbGciOiJIUzUxMiJ9.eyJhY2NvdW50SWQiOiJlNzY0Y2U1OS1jMTAwLTQ2ZDktYTE3ZS0xNDYwODJlYWUxNjYiLCJyb2xlIjoiVFJBSU5FRSIsInR5cGUiOiJhY2Nlc3MiLCJzdWIiOiJudm10aG9haTE0NzM4ODM3QGdtYWlsLmNvbSIsImlhdCI6MTc3MjUzNzcxOCwiZXhwIjoxNzcyNjI0MTE4fQ.jc9IfcWzmuxj3EjlA9_gvzd9AAaFIvwlFC126MPIvbaxlQNzUjVVeRHLG0FjUhJK9QjqM69LHf8cQUd0_80Hjg';

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
export default api;
 