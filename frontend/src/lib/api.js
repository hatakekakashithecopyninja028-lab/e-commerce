import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API_BASE = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Request interceptor to add Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);




// Simple error handling with cookies
api.interceptors.response.use(
  response => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      toast.error('Session expired. Redirecting to login...');
      window.location.href = '/login';
      return Promise.reject(error);
    } else if (error.response?.status === 403) {
      toast.error(error.response?.data?.detail || 'Access denied');
    }
    return Promise.reject(error);
  }
);

export default api;
