import { User } from './user';

// Mirrors App\Modules\Venue\Http\Resources\VenueResource and the
// StoreVenueRequest/UpdateVenueRequest validation rules.

export type VenueStatus = 'ACTIVE' | 'INACTIVE';

export const VENUE_STATUSES: VenueStatus[] = ['ACTIVE', 'INACTIVE'];

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
