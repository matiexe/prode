import { getFlagUrl, getFlagSrcset } from '../utils/flags';
import type { Partido } from '../types';

interface BracketsProps {
  partidos: Partido[];
}

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
        <div key={f} className="bracket-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '220px' }}>
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
            {getPartidosFase(f).map(p => (
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
                      {p.equipoLocal}
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
                      {p.equipoVisitante}
                    </span>
                  </div>
                  {p.estado === 'finalizado' && <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{p.golesVisitante}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
