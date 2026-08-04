import { api } from './client';
import type { AuthResponse, RegisterRequest } from '@/types';

/** POST /api/auth/register — create a new account. */
export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  const { data: response } = await api.post<AuthResponse>('/api/auth/register', data);
  return response;
}

/** POST /api/auth/login — exchange credentials for a JWT. */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const { data: response } = await api.post<AuthResponse>('/api/auth/login', {
    email,
    password,
  });
  return response;
}
