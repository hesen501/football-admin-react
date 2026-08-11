import apiClient from './client';
import { ApiEnvelope, ListParams, PaginatedEnvelope } from '../types/api';
import { Booking, BookingListFilters, CreateBookingData } from '../types/booking';

export type BookingListParams = ListParams & BookingListFilters;

export const listBookings = async (params: BookingListParams = {}): Promise<PaginatedEnvelope<Booking>> => {
  const response = await apiClient.get<PaginatedEnvelope<Booking>>('/api/admin/bookings', { params });
  return response.data;
};

export const getBooking = async (id: number): Promise<Booking> => {
  const response = await apiClient.get<ApiEnvelope<Booking>>(`/api/admin/bookings/${id}`);
  return response.data.data;
};

export const createBooking = async (data: CreateBookingData): Promise<Booking> => {
  const response = await apiClient.post<ApiEnvelope<Booking>>('/api/admin/bookings', data);
  return response.data.data;
};

export const confirmBooking = async (id: number): Promise<Booking> => {
  const response = await apiClient.post<ApiEnvelope<Booking>>(`/api/admin/bookings/${id}/confirm`);
  return response.data.data;
};

export const cancelBooking = async (id: number, reason?: string): Promise<Booking> => {
  const response = await apiClient.post<ApiEnvelope<Booking>>(`/api/admin/bookings/${id}/cancel`, { reason });
  return response.data.data;
};

// One unit per call — the backend only accepts item_id, never a quantity
// (see AddBookingItemRequest); repeated calls increment/decrement in place.
// Both return the full updated booking (items + recalculated totals), so
// callers don't need a separate refetch.
export const addBookingItem = async (bookingId: number, itemId: number): Promise<Booking> => {
  const response = await apiClient.post<ApiEnvelope<Booking>>(`/api/admin/bookings/${bookingId}/items`, {
    item_id: itemId,
  });
  return response.data.data;
};

export const removeBookingItem = async (bookingId: number, itemId: number): Promise<Booking> => {
  const response = await apiClient.delete<ApiEnvelope<Booking>>(`/api/admin/bookings/${bookingId}/items/${itemId}`);
  return response.data.data;
};
