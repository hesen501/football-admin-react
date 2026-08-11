import { Venue } from './venue';

// Mirrors App\Modules\Field\Http\Resources\FieldResource and the
// StoreFieldRequest/UpdateFieldRequest validation rules.

export type FieldType = 'INDOOR' | 'OUTDOOR';
export type FieldStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export const FIELD_TYPES: FieldType[] = ['INDOOR', 'OUTDOOR'];
export const FIELD_STATUSES: FieldStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

export interface Field {
  id: number;
  venue_id: number;
  venue?: Venue;
  name: string;
  description: string | null;
  type: FieldType;
  capacity: number;
  hourly_price: number;
  status: FieldStatus;
  created_at: string;
  updated_at: string;
}

export interface FieldFormData {
  name: string;
  description?: string;
  type: FieldType;
  capacity: number;
  hourly_price: number;
  status?: FieldStatus;
}
