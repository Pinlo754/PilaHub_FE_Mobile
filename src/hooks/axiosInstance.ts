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
  const token =
    'eyJhbGciOiJIUzUxMiJ9.eyJhY2NvdW50SWQiOiJlNzY0Y2U1OS1jMTAwLTQ2ZDktYTE3ZS0xNDYwODJlYWUxNjYiLCJyb2xlIjoiVFJBSU5FRSIsInR5cGUiOiJhY2Nlc3MiLCJzdWIiOiJudm10aG9haTE0NzM4ODM3QGdtYWlsLmNvbSIsImlhdCI6MTc3MzM0ODU0MSwiZXhwIjoxNzczNDM0OTQxfQ.zcAFDPl700Jr58be7HJ3h7TZW_VFSHA8PWQn-wHwvhtYpncelO7vrUAOywvsBTorlzT4Yvf_QIff7psV-toicQ';

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
export default api;
