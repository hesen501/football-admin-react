import { User } from './user';

// Admin panel auth — POST /api/admin/auth/login (Sanctum personal-access
// token, not a JWT: it's an opaque string, nothing to decode client-side).
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}
