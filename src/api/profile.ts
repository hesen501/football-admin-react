import apiClient from './client';
import { uploadImage } from './media';
import { ApiEnvelope } from '../types/api';
import { Media } from '../types/media';
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

// Self-service — always the authenticated user's own avatar (see
// Customer\AvatarController on the backend).
export const uploadMyAvatar = (file: File): Promise<Media> => uploadImage('/api/profile/avatar', file);

export const deleteMyAvatar = async (): Promise<void> => {
  await apiClient.delete('/api/profile/avatar');
};
