import apiClient from './client';
import type { AuthResponse } from '../types';

export async function solicitarOTP(email: string): Promise<{ mensaje: string }> {
  const { data } = await apiClient.post('/auth/solicitar-otp', { email });
  return data;
}

export async function verificarOTP(email: string, codigo: string): Promise<AuthResponse> {
  const { data } = await apiClient.post('/auth/verificar-otp', { email, codigo });
  return data;
}
