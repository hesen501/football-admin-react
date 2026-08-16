import { Media } from './media';

// Mirrors App\Modules\User\Http\Resources\UserResource and the
// StoreUserRequest/UpdateUserRequest validation rules.

export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type Role = 'SUPER_ADMIN' | 'VENUE_MANAGER' | 'CUSTOMER';

export const USER_STATUSES: UserStatus[] = ['ACTIVE', 'SUSPENDED'];
export const ROLES: Role[] = ['SUPER_ADMIN', 'VENUE_MANAGER', 'CUSTOMER'];

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  roles?: string[];
  avatar?: Media | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: Role;
  status?: UserStatus;
}
