import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] 401 recibido para:', error.config?.url, '- redirigiendo a login');
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    } else if (error.response) {
      console.warn('[API] Error', error.response.status, 'para:', error.config?.url);
    } else {
      console.error('[API] Error de red:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
