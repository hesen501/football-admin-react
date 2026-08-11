import apiClient from './client';
import { ApiEnvelope, ListParams, PaginatedEnvelope } from '../types/api';
import { Item, ItemFormData, ItemStatus } from '../types/item';

export interface ItemListParams extends ListParams {
  status?: ItemStatus;
}

export const listItems = async (params: ItemListParams = {}): Promise<PaginatedEnvelope<Item>> => {
  const response = await apiClient.get<PaginatedEnvelope<Item>>('/api/admin/items', { params });
  return response.data;
};

export const getItem = async (id: number): Promise<Item> => {
  const response = await apiClient.get<ApiEnvelope<Item>>(`/api/admin/items/${id}`);
  return response.data.data;
};

export const createItem = async (data: ItemFormData): Promise<Item> => {
  const response = await apiClient.post<ApiEnvelope<Item>>('/api/admin/items', data);
  return response.data.data;
};

export const updateItem = async (id: number, data: Partial<ItemFormData>): Promise<Item> => {
  const response = await apiClient.put<ApiEnvelope<Item>>(`/api/admin/items/${id}`, data);
  return response.data.data;
};

// Thin convenience wrappers around updateItem — there's no dedicated
// activate/deactivate endpoint on the backend, just status on the same
// PUT /api/admin/items/{id} (mirrors Venue/Field status updates).
export const activateItem = (id: number): Promise<Item> => updateItem(id, { status: 'ACTIVE' });
export const deactivateItem = (id: number): Promise<Item> => updateItem(id, { status: 'INACTIVE' });
