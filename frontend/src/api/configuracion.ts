import apiClient from './client';
import type { ConfiguracionPuntos } from '../types';

export async function obtenerConfiguracion(): Promise<ConfiguracionPuntos> {
  const { data } = await apiClient.get('/admin/configuracion');
  return data;
}

export async function actualizarConfiguracion(
  config: Partial<ConfiguracionPuntos>
): Promise<ConfiguracionPuntos> {
  const { data } = await apiClient.put('/admin/configuracion', config);
  return data;
}
