import httpClient from './httpClient';
import type { LoginRequest, LoginResponse } from '../types/api.types';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await httpClient.post<LoginResponse | string>('/auth/login', data);

  // Backend pode retornar token como string pura (antes do fix do LoginResponse.java)
  // ou como objeto { token: "eyJ..." } (depois do fix)
  if (typeof res.data === 'string') {
    return { token: res.data };
  }
  return res.data as LoginResponse;
}
