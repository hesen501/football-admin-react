import { BookingStatus } from './booking';

// Mirrors App\Modules\Dashboard\Services\DashboardService::stats().
// total_users is null for VENUE_MANAGER (platform-wide user admin isn't
// their concern) — only SUPER_ADMIN gets a real count.
export interface DashboardStats {
  total_users: number | null;
  total_venues: number;
  total_fields: number;
  total_bookings: number;
  total_revenue: number;
  total_commission: number;
  total_venue_amount: number;
  booking_status_breakdown: Record<BookingStatus, number>;
}
