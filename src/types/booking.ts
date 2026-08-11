import { Field } from './field';
import { User } from './user';

// Mirrors App\Modules\Booking\Http\Resources\BookingResource and the
// admin StoreBookingRequest/CancelBookingRequest validation rules.

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type BookingSource = 'ADMIN_PANEL' | 'CUSTOMER_APP';

export const BOOKING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
export const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

export interface Booking {
  id: number;
  user?: User;
  field?: Field;
  venue_id: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  hourly_price: number;
  total_price: number;
  commission_rate: number;
  commission_amount: number;
  venue_amount: number;
  source: BookingSource;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingData {
  user_id: number;
  field_id: number;
  start_time: string;
  duration_hours: number;
  notes?: string;
}

export interface BookingListFilters {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  venue_id?: number;
  field_id?: number;
  date_from?: string;
  date_to?: string;
}
