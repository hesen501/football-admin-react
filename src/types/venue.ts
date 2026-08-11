import { User } from './user';

// Mirrors App\Modules\Venue\Http\Resources\VenueResource and the
// StoreVenueRequest/UpdateVenueRequest validation rules.

export type VenueStatus = 'ACTIVE' | 'INACTIVE';

export const VENUE_STATUSES: VenueStatus[] = ['ACTIVE', 'INACTIVE'];

// Mirrors App\Modules\Venue\Http\Resources\VenueWorkingHourResource.
// day_of_week: 0=Sunday..6=Saturday (matches Carbon's ->dayOfWeek).
export interface VenueWorkingHour {
  day_of_week: number;
  day_name: string;
  is_closed: boolean;
  opens_at: string | null; // "HH:MM", null when is_closed
  closes_at: string | null; // "HH:MM", null when is_closed
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// What UpdateVenueWorkingHoursRequest expects for each of the 7 days.
export interface VenueWorkingHourInput {
  day_of_week: number;
  is_closed: boolean;
  opens_at?: string;
  closes_at?: string;
}

export interface Venue {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  status: VenueStatus;
  managers?: User[];
  working_hours?: VenueWorkingHour[];
  created_at: string;
  updated_at: string;
}

export interface VenueFormData {
  name: string;
  description?: string;
  address: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string;
  email?: string;
  status?: VenueStatus;
  manager_id?: number | null;
}
