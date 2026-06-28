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
    avatarSeed?: string | null;
    aciertos: number;
  }>;
  usuariosConPush: number;
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
  shareData?: {
    top3: Array<{
      id: number;
      nombre: string;
      email: string;
      avatarSeed?: string;
      aciertos: number;
      certeros: number;
      parciales: number;
      total: number;
      puntos: number;
    }>;
    global: {
      certeros: number;
      parciales: number;
      total: number;
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

export const obtenerShareData = async (partidoIds?: number[]) => {
  const { data } = await client.post('/admin/stats/share', { partidoIds });
  return data;
};

export const enviarTestPushGlobal = async (titulo?: string, mensaje?: string): Promise<{ mensaje: string }> => {
  const { data } = await client.post('/admin/test-push-global', { titulo, mensaje });
  return data;
};

export const ejecutarDbFix = async (): Promise<{ mensaje: string; detalles: any }> => {
  const { data } = await client.post('/admin/db-fix');
  return data;
};
