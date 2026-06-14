import client from './client';

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

export const obtenerAdminStats = async (): Promise<AdminStats> => {
  const { data } = await client.get('/admin/stats');
  return data;
};
