import { useState } from 'react';
import type { Partido } from '../types';

interface ModalResultadoProps {
  partido: Partido;
  onGuardar: (id: number, local: number, visitante: number, ganadorNombre?: string) => Promise<void>;
  onClose: () => void;
}

export default function ModalResultado({ partido, onGuardar, onClose }: ModalResultadoProps) {
  const [local, setLocal] = useState('');
  const [visitante, setVisitante] = useState('');
  const [ganador, setGanador] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const esEmpate = local !== '' && visitante !== '' && parseInt(local, 10) === parseInt(visitante, 10);
  const mostrarSelectorGanador = partido.fase !== 'grupos' && esEmpate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const gl = parseInt(local, 10);
    const gv = parseInt(visitante, 10);
    if (isNaN(gl) || isNaN(gv)) return;

    if (mostrarSelectorGanador && !ganador) {
      setError('Debes seleccionar un ganador para las eliminatorias');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onGuardar(partido.id, gl, gv, ganador || undefined);
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
                value={local} onChange={(e) => { setLocal(e.target.value); setGanador(''); }}
                required autoFocus
              />
            </div>
            <span className="separador" style={{ alignSelf: 'center', marginTop: '1.5rem' }}>-</span>
            <div className="form-group">
              <label>{partido.equipoVisitante}</label>
              <input
                type="number" min="0" max="20"
                value={visitante} onChange={(e) => { setVisitante(e.target.value); setGanador(''); }}
                required
              />
            </div>
          </div>

          {mostrarSelectorGanador && (
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>Ganador (Penales)</label>
              <select 
                value={ganador} 
                onChange={(e) => setGanador(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'var(--surface-container-low)', color: 'var(--text)', border: '1px solid var(--outline-variant)' }}
              >
                <option value="">Selecciona quién avanza...</option>
                <option value={partido.equipoLocal}>{partido.equipoLocal}</option>
                <option value={partido.equipoVisitante}>{partido.equipoVisitante}</option>
              </select>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
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
