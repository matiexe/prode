import client from './client';

export interface AdminStats {
  totalUsuarios: number;
  usuariosActivos: number;
  totalPronosticos: number;
  totalPartidos: number;
  partidosFinalizados: number;
  partidosPendientes: number;
}

export const obtenerAdminStats = async (): Promise<AdminStats> => {
  const { data } = await client.get('/admin/stats');
  return data;
};
