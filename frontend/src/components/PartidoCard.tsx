import { useState } from 'react';
import type { Partido } from '../types';
import { getFlagUrl, getFlagSrcset } from '../utils/flags';

interface PartidoCardProps {
  partido: Partido;
  golesLocal?: number;
  golesVisitante?: number;
  puntosObtenidos?: number | null;
  onGuardar: (local: number, visitante: number) => Promise<void>;
  onInputChange?: (partidoId: number, local: string, visitante: string) => void;
  readonly?: boolean;
}

export default function PartidoCard({
  partido,
  golesLocal: inicialLocal,
  golesVisitante: inicialVisitante,
  puntosObtenidos,
  onGuardar,
  onInputChange,
  readonly = false,
}: PartidoCardProps) {
  const [local, setLocal] = useState(inicialLocal?.toString() ?? '');
  const [visitante, setVisitante] = useState(inicialVisitante?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const fecha = new Date(partido.fechaHora).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });

  const yaJugado = partido.estado !== 'pendiente';
  const puedeEditar = partido.estado === 'pendiente' && !readonly;

  const handleSave = async () => {
    const gl = parseInt(local, 10);
    const gv = parseInt(visitante, 10);
    if (isNaN(gl) || isNaN(gv)) return;
    setSaving(true);
    try {
      await onGuardar(gl, gv);
    } finally {
      setSaving(false);
    }
  };

  const flagLocal = getFlagUrl(partido.equipoLocal);
  const flagVisitante = getFlagUrl(partido.equipoVisitante);
  const srcsetLocal = getFlagSrcset(partido.equipoLocal);
  const srcsetVisitante = getFlagSrcset(partido.equipoVisitante);

  return (
    <div className={`partido-card ${yaJugado ? 'finalizado' : ''}`}>
      <div className="partido-header">
        <span className="fase-tag">{partido.fase}</span>
        {partido.grupo && <span className="grupo-tag">Grupo {partido.grupo}</span>}
        <span className="fecha">{fecha}</span>
      </div>

      <div className="partido-body">
        <div className="equipo">
          {flagLocal ? <img className="flag-icon" src={flagLocal} srcSet={srcsetLocal} alt="" /> : null}
          {partido.equipoLocal}
        </div>

        <div className="marcador">
          {partido.estado === 'finalizado' ? (
            <span className="resultado-real">
              {partido.golesLocal} - {partido.golesVisitante}
            </span>
          ) : (
            <span className="vs">vs</span>
          )}

          {puedeEditar && (
            <div className="pronostico-inputs">
              <input
                type="number"
                min="0"
                max="20"
                value={local}
                onChange={(e) => {
                  const v = e.target.value;
                  setLocal(v);
                  onInputChange?.(partido.id, v, visitante);
                }}
                className="input-gol"
                placeholder="?"
              />
              <span className="separador">-</span>
              <input
                type="number"
                min="0"
                max="20"
                value={visitante}
                onChange={(e) => {
                  const v = e.target.value;
                  setVisitante(v);
                  onInputChange?.(partido.id, local, v);
                }}
                className="input-gol"
                placeholder="?"
              />
              <button
                onClick={handleSave}
                className="btn-save"
                disabled={saving || !local || !visitante}
              >
                {saving ? '...' : 'Guardar'}
              </button>
            </div>
          )}

          {yaJugado && (
            <div className="mi-pronostico">
              <span className="pronostico-label">Tu pronostico:</span>
              <span className="pronostico-valor">
                {inicialLocal ?? '-'} - {inicialVisitante ?? '-'}
              </span>
              {partido.estado === 'finalizado' && (
                <span className="puntos-obtenidos">
                  +{puntosObtenidos ?? (inicialLocal !== undefined ? '?' : 0)} pts
                </span>
              )}
            </div>
          )}
        </div>

        <div className="equipo">
          {flagVisitante ? <img className="flag-icon" src={flagVisitante} srcSet={srcsetVisitante} alt="" /> : null}
          {partido.equipoVisitante}
        </div>
      </div>
    </div>
  );
}
