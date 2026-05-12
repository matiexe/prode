import apiClient from './client';
import type { Usuario } from '../types';

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await apiClient.get('/admin/usuarios');
  return data;
}

export async function crearUsuario(nombre: string, email: string, rol?: string): Promise<Usuario> {
  const { data } = await apiClient.post('/admin/usuarios', { nombre, email, rol });
  return data;
}

export async function actualizarUsuario(
  id: number,
  datos: Partial<Usuario>
): Promise<Usuario> {
  const { data } = await apiClient.put(`/admin/usuarios/${id}`, datos);
  return data;
}

export async function desactivarUsuario(id: number): Promise<void> {
  await apiClient.delete(`/admin/usuarios/${id}`);
}
