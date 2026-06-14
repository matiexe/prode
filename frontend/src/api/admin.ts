import client from './client';
import type { Pronostico } from '../types';

export interface AdminStats {
  totalUsuarios: number;
  usuariosActivos: number;
  totalPronosticos: number;
  totalPartidos: number;
  partidosFinalizados: number;
  partidosPendientes: number;
  tasaCobertura: number;
  usuariosDormidos: Array<{
    id: number;
    nombre: string;
    email: string;
  }>;
  topCerteros: Array<{
    id: number;
    nombre: string;
    email: string;
    aciertos: number;
  }>;
}

export interface AdminInsights {
  oraculo: {
    favorito: string;
    partidoMasEmpatado: string;
    marcadorComun: string;
  };
  calidad: {
    promedioPuntos: string | number;
    mejorEfectividad: {
      nombre: string;
      porcentaje: number;
    };
  };
  seguridad: {
    conexionesHoy: number;
    roles: {
      admin: number;
      user: number;
    };
  };
}

export const obtenerAdminStats = async (): Promise<AdminStats> => {
  const { data } = await client.get('/admin/stats');
  return data;
};

export const obtenerAdminInsights = async (): Promise<AdminInsights> => {
  const { data } = await client.get('/admin/stats/insights');
  return data;
};

export const obtenerPronosticosUsuario = async (usuarioId: number): Promise<Pronostico[]> => {
  const { data } = await client.get(`/admin/pronosticos/${usuarioId}`);
  return data;
};
