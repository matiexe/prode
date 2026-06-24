import { getFlagUrl, getFlagSrcset } from '../utils/flags';
import type { Partido } from '../types';

interface BracketsProps {
  partidos: Partido[];
}

const posiciones16vos = [
  { local: "2° Grupo A", visitante: "2° Grupo B" },
  { local: "1° Grupo A", visitante: "1° Mejor Tercero" },
  { local: "1° Grupo B", visitante: "2° Mejor Tercero" },
  { local: "1° Grupo C", visitante: "3° Mejor Tercero" },
  { local: "1° Grupo D", visitante: "4° Mejor Tercero" },
  { local: "1° Grupo E", visitante: "2° Grupo F" },
  { local: "1° Grupo F", visitante: "5° Mejor Tercero" },
  { local: "1° Grupo G", visitante: "6° Mejor Tercero" },
  { local: "2° Grupo C", visitante: "2° Grupo D" },
  { local: "1° Grupo H", visitante: "2° Grupo J" },
  { local: "1° Grupo I", visitante: "7° Mejor Tercero" },
  { local: "1° Grupo J", visitante: "2° Grupo L" },
  { local: "1° Grupo K", visitante: "8° Mejor Tercero" },
  { local: "1° Grupo L", visitante: "2° Grupo G" },
  { local: "2° Grupo G", visitante: "2° Grupo I" },
  { local: "2° Grupo E", visitante: "2° Grupo H" },
];

export default function Brackets({ partidos }: BracketsProps) {
  const fases = ['16vos', '8vos', 'cuartos', 'semis', 'final'];
  
  const getPartidosFase = (f: string) => {
    return partidos.filter(p => p.fase === f).sort((a, b) => a.id - b.id);
  };

  return (
    <div className="brackets-container" style={{ 
      display: 'flex', 
      gap: '2rem', 
      overflowX: 'auto', 
      padding: '2rem 0',
      alignItems: 'center' 
    }}>
      {fases.map((f) => (
        <div key={f} className="bracket-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '240px' }}>
          <h4 style={{ 
            textAlign: 'center', 
            fontSize: '0.7rem', 
            color: 'var(--primary)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em',
            marginBottom: '0.5rem'
          }}>
            {f === '16vos' ? '16vos' : f === '8vos' ? '8vos' : f === 'cuartos' ? 'Cuartos' : f === 'semis' ? 'Semis' : 'Final'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1, gap: '1rem' }}>
            {getPartidosFase(f).map((p, idx) => {
              const labelLocal = f === '16vos' && posiciones16vos[idx] ? posiciones16vos[idx].local : null;
              const labelVisitante = f === '16vos' && posiciones16vos[idx] ? posiciones16vos[idx].visitante : null;

              return (
                <div key={p.id} className="bracket-match glass-card" style={{ 
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  fontSize: '0.8rem',
                  border: p.estado === 'finalizado' ? '1px solid var(--primary)' : '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getFlagUrl(p.equipoLocal) && <img className="flag-icon" src={getFlagUrl(p.equipoLocal)} srcSet={getFlagSrcset(p.equipoLocal)} alt="" />}
                      <span style={{ 
                        fontWeight: p.estado === 'finalizado' && p.ganadorNombre === p.equipoLocal ? '700' : '400',
                        color: p.equipoLocal === 'Por definir' ? 'var(--outline)' : 'inherit'
                      }}>
                        {p.equipoLocal === 'Por definir' && labelLocal ? labelLocal : p.equipoLocal}
                        {p.equipoLocal !== 'Por definir' && labelLocal && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--outline)', marginLeft: '0.4rem', fontWeight: '400' }}>
                            ({labelLocal})
                          </span>
                        )}
                      </span>
                    </div>
                    {p.estado === 'finalizado' && <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{p.golesLocal}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getFlagUrl(p.equipoVisitante) && <img className="flag-icon" src={getFlagUrl(p.equipoVisitante)} srcSet={getFlagSrcset(p.equipoVisitante)} alt="" />}
                      <span style={{ 
                        fontWeight: p.estado === 'finalizado' && p.ganadorNombre === p.equipoVisitante ? '700' : '400',
                        color: p.equipoVisitante === 'Por definir' ? 'var(--outline)' : 'inherit'
                      }}>
                        {p.equipoVisitante === 'Por definir' && labelVisitante ? labelVisitante : p.equipoVisitante}
                        {p.equipoVisitante !== 'Por definir' && labelVisitante && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--outline)', marginLeft: '0.4rem', fontWeight: '400' }}>
                            ({labelVisitante})
                          </span>
                        )}
                      </span>
                    </div>
                    {p.estado === 'finalizado' && <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{p.golesVisitante}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
