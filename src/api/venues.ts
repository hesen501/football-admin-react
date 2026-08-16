import apiClient from './client';
import { uploadImage } from './media';
import { ApiEnvelope, ListParams, PaginatedEnvelope } from '../types/api';
import { Media } from '../types/media';
import { Venue, VenueFormData, VenueStatus, VenueWorkingHour, VenueWorkingHourInput } from '../types/venue';

export interface VenueListParams extends ListParams {
  status?: VenueStatus;
  manager_id?: number;
}

export const listVenues = async (params: VenueListParams = {}): Promise<PaginatedEnvelope<Venue>> => {
  const response = await apiClient.get<PaginatedEnvelope<Venue>>('/api/admin/venues', { params });
  return response.data;
};

export const getVenue = async (id: number): Promise<Venue> => {
  const response = await apiClient.get<ApiEnvelope<Venue>>(`/api/admin/venues/${id}`);
  return response.data.data;
};

export const createVenue = async (data: VenueFormData): Promise<Venue> => {
  const response = await apiClient.post<ApiEnvelope<Venue>>('/api/admin/venues', data);
  return response.data.data;
};

export const updateVenue = async (id: number, data: Partial<VenueFormData>): Promise<Venue> => {
  const response = await apiClient.put<ApiEnvelope<Venue>>(`/api/admin/venues/${id}`, data);
  return response.data.data;
};

export const deleteVenue = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/admin/venues/${id}`);
};

export const getVenueWorkingHours = async (venueId: number): Promise<VenueWorkingHour[]> => {
  const response = await apiClient.get<ApiEnvelope<VenueWorkingHour[]>>(`/api/admin/venues/${venueId}/working-hours`);
  return response.data.data;
};

export const updateVenueWorkingHours = async (
  venueId: number,
  days: VenueWorkingHourInput[]
): Promise<VenueWorkingHour[]> => {
  const response = await apiClient.put<ApiEnvelope<VenueWorkingHour[]>>(
    `/api/admin/venues/${venueId}/working-hours`,
    { days }
  );
  return response.data.data;
};

// A venue has any number of gallery images plus at most one of them
// promoted to cover — see MediaCollection on the backend.
export const listVenueImages = async (venueId: number): Promise<Media[]> => {
  const response = await apiClient.get<ApiEnvelope<Media[]>>(`/api/admin/venues/${venueId}/images`);
  return response.data.data;
};

export const uploadVenueImage = (venueId: number, file: File): Promise<Media> =>
  uploadImage(`/api/admin/venues/${venueId}/images`, file);

export const deleteVenueImage = async (venueId: number, mediaId: number): Promise<void> => {
  await apiClient.delete(`/api/admin/venues/${venueId}/images/${mediaId}`);
};

export const setVenueCoverImage = async (venueId: number, mediaId: number): Promise<Media> => {
  const response = await apiClient.put<ApiEnvelope<Media>>(`/api/admin/venues/${venueId}/images/${mediaId}/cover`);
  return response.data.data;
};

export const reorderVenueImages = async (
  venueId: number,
  images: { id: number; sort_order: number }[]
): Promise<Media[]> => {
  const response = await apiClient.patch<ApiEnvelope<Media[]>>(`/api/admin/venues/${venueId}/images/order`, {
    images,
  });
  return response.data.data;
};
