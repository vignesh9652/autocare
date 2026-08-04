import { api } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types';

/** POST /api/auth/register */
export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/register', payload);
  return data;
}

/** POST /api/auth/login */
export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', payload);
  return data;
}
