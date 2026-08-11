import apiClient from './client';
import { ApiEnvelope, ListParams, PaginatedEnvelope } from '../types/api';
import { Field, FieldFormData, FieldStatus } from '../types/field';

export interface FieldListParams extends ListParams {
  status?: FieldStatus;
  venue_id?: number;
}

export const listFields = async (params: FieldListParams = {}): Promise<PaginatedEnvelope<Field>> => {
  const response = await apiClient.get<PaginatedEnvelope<Field>>('/api/admin/fields', { params });
  return response.data;
};

export const getField = async (id: number): Promise<Field> => {
  const response = await apiClient.get<ApiEnvelope<Field>>(`/api/admin/fields/${id}`);
  return response.data.data;
};

// Creation is nested under its parent venue (see FieldController::store).
export const createField = async (venueId: number, data: FieldFormData): Promise<Field> => {
  const response = await apiClient.post<ApiEnvelope<Field>>(`/api/admin/venues/${venueId}/fields`, data);
  return response.data.data;
};

export const updateField = async (id: number, data: Partial<FieldFormData>): Promise<Field> => {
  const response = await apiClient.put<ApiEnvelope<Field>>(`/api/admin/fields/${id}`, data);
  return response.data.data;
};

export const deleteField = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/admin/fields/${id}`);
};

export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface FieldAvailability {
  field_id: number;
  date: string;
  slots: AvailabilitySlot[];
}

export const getFieldAvailability = async (fieldId: number, date: string): Promise<FieldAvailability> => {
  const response = await apiClient.get<ApiEnvelope<FieldAvailability>>(
    `/api/admin/fields/${fieldId}/availability`,
    { params: { date } },
  );
  return response.data.data;
};
