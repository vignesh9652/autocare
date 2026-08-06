import type { AccountStatus, Role } from './common';

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
  /** Requested account role. Defaults to CUSTOMER; MECHANIC requires admin approval. */
  role?: Role;
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
  /** Approval lifecycle — mechanics are PENDING until an admin approves them. */
  status?: AccountStatus;
  createdAt: string;
}
