import { getFlagUrl, getFlagSrcset } from '../utils/flags';

export interface EquipoPosicion {
  equipo: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

interface TablaGrupoProps {
  titulo: string;
  posiciones: EquipoPosicion[];
}

export default function TablaGrupo({ titulo, posiciones }: TablaGrupoProps) {
  return (
    <div className="ranking-table-container glass-card" style={{ marginBottom: '2rem' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
        <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)' }}>
          {titulo}
        </h3>
      </div>
      <table className="ranking-table">
        <thead>
          <tr>
            <th style={{ width: '3rem' }}>#</th>
            <th>Equipo</th>
            <th style={{ textAlign: 'center' }}>PJ</th>
            <th style={{ textAlign: 'center' }}>DG</th>
            <th style={{ textAlign: 'right' }}>PTS</th>
          </tr>
        </thead>
        <tbody>
          {posiciones.map((pos, i) => (
            <tr key={pos.equipo} style={i < 2 ? { background: 'rgba(0, 228, 118, 0.03)' } : {}}>
              <td className="ranking-pos" style={{ fontSize: '1rem' }}>{i + 1}</td>
              <td>
                <div className="ranking-user">
                  {getFlagUrl(pos.equipo) && (
                    <img 
                      className="flag-icon" 
                      src={getFlagUrl(pos.equipo)} 
                      srcSet={getFlagSrcset(pos.equipo)} 
                      alt="" 
                    />
                  )}
                  <span className="ranking-user-name" style={{ fontSize: '0.75rem' }}>{pos.equipo}</span>
                </div>
              </td>
              <td style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{pos.pj}</td>
              <td style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                {pos.dg > 0 ? `+${pos.dg}` : pos.dg}
              </td>
              <td className="ranking-pts" style={{ fontSize: '1rem' }}>{pos.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
