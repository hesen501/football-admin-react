import apiClient from './client';
import { ApiEnvelope } from '../types/api';
import { User } from '../types/user';

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string;
}

export const getProfile = async (): Promise<User> => {
  const response = await apiClient.get<ApiEnvelope<User>>('/api/profile');
  return response.data.data;
};

export const updateProfile = async (data: UpdateProfileData): Promise<User> => {
  const response = await apiClient.put<ApiEnvelope<User>>('/api/profile', data);
  return response.data.data;
};
