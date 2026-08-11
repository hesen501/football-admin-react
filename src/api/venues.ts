import apiClient from './client';
import { ApiEnvelope, ListParams, PaginatedEnvelope } from '../types/api';
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
