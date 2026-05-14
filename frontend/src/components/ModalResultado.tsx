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

    let ganadorFinal = ganador;
    
    // Si no es empate, el ganador es obvio (pero solo para eliminatorias nos importa el nombre)
    if (partido.fase !== 'grupos' && !esEmpate) {
      ganadorFinal = gl > gv ? partido.equipoLocal : partido.equipoVisitante;
    }

    if (mostrarSelectorGanador && !ganadorFinal) {
      setError('Debes especificar qué equipo gana por penales');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onGuardar(partido.id, gl, gv, ganadorFinal || undefined);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar resultado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid var(--primary)', boxShadow: '0 0 40px rgba(177, 198, 249, 0.2)' }}>
        <h2 style={{ fontFamily: 'Anybody', textTransform: 'uppercase', fontSize: '1.25rem' }}>Cargar Resultado</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', opacity: 0.7 }}>
          <span className="fase-tag">{partido.fase}</span>
          {partido.grupo && <span className="grupo-tag">Grupo {partido.grupo}</span>}
        </div>
        
        <p className="modal-partido" style={{ fontWeight: 700, textAlign: 'center', fontSize: '1.2rem', marginBottom: '2rem' }}>
          {partido.equipoLocal} <span style={{ color: var(--primary), margin: '0 0.5rem' }}>VS</span> {partido.equipoVisitante}
        </p>

        {error && <div className="error-message" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="resultado-inputs" style={{ justifyContent: 'center', gap: '2rem' }}>
            <div className="form-group" style={{ textAlign: 'center' }}>
              <label style={{ fontSize: '0.65rem', marginBottom: '0.5rem' }}>LOCAL</label>
              <input
                type="number" min="0" max="20"
                value={local} onChange={(e) => { setLocal(e.target.value); setGanador(''); }}
                required autoFocus
                className="input-gol"
                style={{ width: '4rem', height: '4rem', fontSize: '1.5rem' }}
              />
            </div>
            <div className="form-group" style={{ textAlign: 'center' }}>
              <label style={{ fontSize: '0.65rem', marginBottom: '0.5rem' }}>VISITANTE</label>
              <input
                type="number" min="0" max="20"
                value={visitante} onChange={(e) => { setVisitante(e.target.value); setGanador(''); }}
                required
                className="input-gol"
                style={{ width: '4rem', height: '4rem', fontSize: '1.5rem' }}
              />
            </div>
          </div>

          {mostrarSelectorGanador && (
            <div className="form-group animate-slide-up" style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(177, 198, 249, 0.05)', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>sports_soccer</span>
                Ganador por penales
              </label>
              <select 
                value={ganador} 
                onChange={(e) => setGanador(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--surface-container-highest)', color: 'var(--text)', border: '1px solid var(--outline-variant)', fontWeight: 600 }}
              >
                <option value="">Selecciona quién avanza...</option>
                <option value={partido.equipoLocal}>{partido.equipoLocal}</option>
                <option value={partido.equipoVisitante}>{partido.equipoVisitante}</option>
              </select>
              <p style={{ fontSize: '0.65rem', color: 'var(--outline)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                En fases eliminatorias es obligatorio desempatar.
              </p>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button type="submit" className="admin-btn primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
              {loading ? 'Guardando...' : 'Confirmar Resultado'}
            </button>
            <button type="button" className="admin-btn secondary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
