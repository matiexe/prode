import { useState, useEffect } from 'react';
import type { Usuario } from '../types';

interface FormUsuarioProps {
  onSubmit: (nombre: string, email: string, rol: string) => Promise<void>;
  onCancel: () => void;
  usuario?: Usuario | null;
}

export default function FormUsuario({ onSubmit, onCancel, usuario }: FormUsuarioProps) {
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [rol, setRol] = useState(usuario?.rol || 'user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setEmail(usuario.email);
      setRol(usuario.rol);
    }
  }, [usuario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit(nombre, email, rol);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-usuario">
      <h3 style={{ fontFamily: 'Anybody', fontSize: '0.9rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
        {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
      </h3>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <label htmlFor="nombre">Nombre</label>
        <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={3} autoFocus />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="rol">Rol</label>
        <select id="rol" value={rol} onChange={(e) => setRol(e.target.value as 'admin' | 'user')}>
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Procesando...' : (usuario ? 'Guardar Cambios' : 'Crear usuario')}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
