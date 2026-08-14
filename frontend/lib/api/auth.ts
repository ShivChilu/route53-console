import { request } from './client';
import { User, LoginRequest } from '../../types';

export async function login(credentials: LoginRequest): Promise<{ token: string; user: User }> {
  const data = await request<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  
  // Persist token in localStorage for fallback header support
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  return data;
}

export async function logout(): Promise<void> {
  await request<void>('/api/auth/logout', {
    method: 'POST',
  });
  localStorage.removeItem('token');
}

export async function getMe(): Promise<User> {
  return request<User>('/api/auth/me');
}
