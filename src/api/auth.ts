import apiClient from './client';
import { LoginRequest, LoginResult } from '../types/auth';
import { ApiEnvelope } from '../types/api';
import { User } from '../types/user';

export const loginAdminApi = async (data: LoginRequest): Promise<LoginResult> => {
  const response = await apiClient.post<ApiEnvelope<LoginResult>>('/api/admin/auth/login', data);
  return response.data.data;
};

export const logoutAdminApi = async (): Promise<void> => {
  await apiClient.post('/api/admin/auth/logout');
};

export const fetchCurrentAdminApi = async (): Promise<User> => {
  const response = await apiClient.get<ApiEnvelope<User>>('/api/admin/auth/me');
  return response.data.data;
};
