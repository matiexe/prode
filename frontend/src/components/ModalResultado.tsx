import { useState } from 'react';
import type { Partido } from '../types';

interface ModalResultadoProps {
  partido: Partido;
  onGuardar: (id: number, local: number, visitante: number) => Promise<void>;
  onClose: () => void;
}

export default function ModalResultado({ partido, onGuardar, onClose }: ModalResultadoProps) {
  const [local, setLocal] = useState('');
  const [visitante, setVisitante] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const gl = parseInt(local, 10);
    const gv = parseInt(visitante, 10);
    if (isNaN(gl) || isNaN(gv)) return;

    setLoading(true);
    setError('');
    try {
      await onGuardar(partido.id, gl, gv);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar resultado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Cargar resultado</h2>
        <p className="modal-partido">{partido.equipoLocal} vs {partido.equipoVisitante}</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="resultado-inputs">
            <div className="form-group">
              <label>{partido.equipoLocal}</label>
              <input
                type="number" min="0" max="20"
                value={local} onChange={(e) => setLocal(e.target.value)}
                required autoFocus
              />
            </div>
            <span className="separador">-</span>
            <div className="form-group">
              <label>{partido.equipoVisitante}</label>
              <input
                type="number" min="0" max="20"
                value={visitante} onChange={(e) => setVisitante(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar resultado'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
