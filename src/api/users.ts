import apiClient from './client';
import { ApiEnvelope, ListParams, PaginatedEnvelope } from '../types/api';
import { Role, User, UserFormData, UserStatus } from '../types/user';

export interface UserListParams extends ListParams {
  role?: Role;
  status?: UserStatus;
}

export const listUsers = async (params: UserListParams = {}): Promise<PaginatedEnvelope<User>> => {
  const response = await apiClient.get<PaginatedEnvelope<User>>('/api/admin/users', { params });
  return response.data;
};

export const getUser = async (id: number): Promise<User> => {
  const response = await apiClient.get<ApiEnvelope<User>>(`/api/admin/users/${id}`);
  return response.data.data;
};

export const createUser = async (data: UserFormData): Promise<User> => {
  const response = await apiClient.post<ApiEnvelope<User>>('/api/admin/users', data);
  return response.data.data;
};

export const updateUser = async (id: number, data: Partial<UserFormData>): Promise<User> => {
  const response = await apiClient.put<ApiEnvelope<User>>(`/api/admin/users/${id}`, data);
  return response.data.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/admin/users/${id}`);
};
