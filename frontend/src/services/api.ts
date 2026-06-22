import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  PagedResult,
} from '../types/task';
import { getToken, clearAuthStorage } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized: clear auth and redirect to login
      clearAuthStorage();
      window.location.href = '/login';
    }

    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error: No response from server');
    } else {
      // Error in request setup
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const taskApi = {
  getAll: async (): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>('/tasks');
    return response.data;
  },

  getPaged: async (page: number, pageSize: number): Promise<PagedResult<Task>> => {
    const response = await apiClient.get<PagedResult<Task>>('/tasks', {
      params: { page, pageSize },
    });
    return response.data;
  },

  getById: async (id: number): Promise<Task> => {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: CreateTaskDto): Promise<Task> => {
    const response = await apiClient.post<Task>('/tasks', data);
    return response.data;
  },

  update: async (id: number, data: UpdateTaskDto): Promise<Task> => {
    const response = await apiClient.put<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, data: UpdateTaskStatusDto): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${id}/status`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};
