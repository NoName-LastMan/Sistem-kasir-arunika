import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // URL Backend Laravel
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Interceptor untuk menyisipkan token ke setiap request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('pos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor untuk menangani 401 secara global
let isRedirectingToLogin = false;

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && !isRedirectingToLogin) {
      isRedirectingToLogin = true;
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;