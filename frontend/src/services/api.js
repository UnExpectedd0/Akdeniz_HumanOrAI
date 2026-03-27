import axios from 'axios';

// Uses relative path — works in both dev (Vite proxy) and production (same origin)
const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
