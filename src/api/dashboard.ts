import apiClient from './client';
import { ApiEnvelope } from '../types/api';
import { Booking } from '../types/booking';
import { DashboardStats } from '../types/dashboard';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get<ApiEnvelope<DashboardStats>>('/api/admin/dashboard/stats');
  return response.data.data;
};

export const getRecentBookings = async (limit = 10): Promise<Booking[]> => {
  const response = await apiClient.get<ApiEnvelope<Booking[]>>('/api/admin/dashboard/recent-bookings', {
    params: { limit },
  });
  return response.data.data;
};
