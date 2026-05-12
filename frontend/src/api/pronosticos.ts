import apiClient from './client';
import type { Pronostico, RankingEntry } from '../types';

export async function obtenerMisPronosticos(): Promise<Pronostico[]> {
  const { data } = await apiClient.get('/pronosticos/mis');
  return data;
}

export async function guardarPronostico(
  partidoId: number,
  golesLocal: number,
  golesVisitante: number
): Promise<void> {
  await apiClient.put('/pronosticos', { partidoId, golesLocal, golesVisitante });
}

export async function obtenerRanking(): Promise<RankingEntry[]> {
  const { data } = await apiClient.get('/pronosticos/puntajes');
  return data;
}
