import apiClient from './client';
import { uploadImage } from './media';
import { ApiEnvelope, ListParams, PaginatedEnvelope } from '../types/api';
import { Field, FieldFormData, FieldStatus } from '../types/field';
import { Media } from '../types/media';

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

// Same gallery-plus-one-cover shape as venue images — see VenueImageController's
// docblock on the backend.
export const listFieldImages = async (fieldId: number): Promise<Media[]> => {
  const response = await apiClient.get<ApiEnvelope<Media[]>>(`/api/admin/fields/${fieldId}/images`);
  return response.data.data;
};

export const uploadFieldImage = (fieldId: number, file: File): Promise<Media> =>
  uploadImage(`/api/admin/fields/${fieldId}/images`, file);

export const deleteFieldImage = async (fieldId: number, mediaId: number): Promise<void> => {
  await apiClient.delete(`/api/admin/fields/${fieldId}/images/${mediaId}`);
};

export const setFieldCoverImage = async (fieldId: number, mediaId: number): Promise<Media> => {
  const response = await apiClient.put<ApiEnvelope<Media>>(`/api/admin/fields/${fieldId}/images/${mediaId}/cover`);
  return response.data.data;
};

export const reorderFieldImages = async (
  fieldId: number,
  images: { id: number; sort_order: number }[]
): Promise<Media[]> => {
  const response = await apiClient.patch<ApiEnvelope<Media[]>>(`/api/admin/fields/${fieldId}/images/order`, {
    images,
  });
  return response.data.data;
};
