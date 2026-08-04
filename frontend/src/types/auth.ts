import type { Role } from './common';

/** POST /api/auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /api/auth/register */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

/** Response of both login and register (AuthResponse on the backend). */
export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  role: Role;
}

/** Admin-facing user summary (UserResponse on the backend). */
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  createdAt: string;
}
