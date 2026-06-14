import apiClient from './client';
import type { ConfiguracionPuntos } from '../types';

export async function obtenerConfiguracion(t?: number): Promise<ConfiguracionPuntos> {
  const url = t ? `/admin/configuracion?t=${t}` : '/admin/configuracion';
  const { data } = await apiClient.get(url);
  return data;
}

export async function actualizarConfiguracion(
  config: Partial<ConfiguracionPuntos>
): Promise<ConfiguracionPuntos> {
  const { data } = await apiClient.put('/admin/configuracion', config);
  return data;
}
