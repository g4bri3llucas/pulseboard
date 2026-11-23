import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = axios.isAxiosError(error) && error.config?.url?.startsWith('/auth/');

    if (axios.isAxiosError(error) && error.response?.status === 401 && !isAuthRoute) {
      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);
