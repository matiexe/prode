import apiClient from './client';
import type { Partido } from '../types';

export async function listarPartidos(fase?: string, grupo?: string): Promise<Partido[]> {
  const params = new URLSearchParams();
  if (fase) params.append('fase', fase);
  if (grupo) params.append('grupo', grupo);
  const { data } = await apiClient.get(`/partidos?${params}`);
  return data;
}

export async function generarFixture(): Promise<{ mensaje: string; totalPartidos: number }> {
  const { data } = await apiClient.post('/admin/partidos/generar');
  return data;
}

export async function eliminarFixture(): Promise<{ mensaje: string }> {
  const { data } = await apiClient.delete('/admin/partidos');
  return data;
}

export async function cargarResultado(
  id: number,
  golesLocal: number,
  golesVisitante: number
): Promise<void> {
  await apiClient.put(`/admin/partidos/${id}/resultado`, { golesLocal, golesVisitante });
}
