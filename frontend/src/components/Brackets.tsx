import { getFlagUrl, getFlagSrcset } from '../utils/flags';
import type { Partido } from '../types';

interface BracketsProps {
  partidos: Partido[];
}

const posiciones16vos = [
  { local: "2° Grupo A", visitante: "2° Grupo B" }, // P73: 2A vs 2B
  { local: "1° Grupo E", visitante: "1° Mejor Tercero" }, // P74: 1E vs 3rd
  { local: "1° Grupo F", visitante: "2° Grupo C" }, // P75: 1F vs 2C
  { local: "1° Grupo C", visitante: "2° Grupo F" }, // P76: 1C vs 2F
  { local: "1° Grupo I", visitante: "2° Mejor Tercero" }, // P77: 1I vs 3rd
  { local: "2° Grupo E", visitante: "2° Grupo I" }, // P78: 2E vs 2I
  { local: "1° Grupo A", visitante: "3° Mejor Tercero" }, // P79: 1A vs 3rd
  { local: "1° Grupo L", visitante: "4° Mejor Tercero" }, // P80: 1L vs 3rd
  { local: "1° Grupo D", visitante: "5° Mejor Tercero" }, // P81: 1D vs 3rd
  { local: "1° Grupo G", visitante: "6° Mejor Tercero" }, // P82: 1G vs 3rd
  { local: "2° Grupo K", visitante: "2° Grupo L" }, // P83: 2K vs 2L
  { local: "1° Grupo H", visitante: "2° Grupo J" }, // P84: 1H vs 2J
  { local: "1° Grupo B", visitante: "7° Mejor Tercero" }, // P85: 1B vs 3rd
  { local: "1° Grupo J", visitante: "2° Grupo H" }, // P86: 1J vs 2H
  { local: "1° Grupo K", visitante: "8° Mejor Tercero" }, // P87: 1K vs 3rd
  { local: "2° Grupo D", visitante: "2° Grupo G" }, // P88: 2D vs 2G
];

export default function Brackets({ partidos }: BracketsProps) {
  const sorted16vos = partidos.filter(p => p.fase === '16vos').sort((a, b) => a.id - b.id);
  const sorted8vos = partidos.filter(p => p.fase === '8vos').sort((a, b) => a.id - b.id);
  const sortedCuartos = partidos.filter(p => p.fase === 'cuartos').sort((a, b) => a.id - b.id);
  const sortedSemis = partidos.filter(p => p.fase === 'semis').sort((a, b) => a.id - b.id);
  
  const finalMatch = partidos.find(p => p.fase === 'final');
  const tercerPuestoMatch = partidos.find(p => p.fase === '3er_puesto');

  // Distribución del bracket izquierdo (top a bottom)
  const left16vos = [1, 4, 0, 2, 10, 11, 8, 9].map(idx => sorted16vos[idx]).filter(Boolean);
  const left8vos = [0, 1, 4, 5].map(idx => sorted8vos[idx]).filter(Boolean);
  const leftCuartos = [0, 1].map(idx => sortedCuartos[idx]).filter(Boolean);
  const leftSemis = [0].map(idx => sortedSemis[idx]).filter(Boolean);

  // Distribución del bracket derecho (top a bottom)
  const rightSemis = [1].map(idx => sortedSemis[idx]).filter(Boolean);
  const rightCuartos = [2, 3].map(idx => sortedCuartos[idx]).filter(Boolean);
  const right8vos = [2, 3, 6, 7].map(idx => sorted8vos[idx]).filter(Boolean);
  const right16vos = [3, 5, 6, 7, 13, 15, 12, 14].map(idx => sorted16vos[idx]).filter(Boolean);

  const renderMatchCard = (p: Partido) => {
    const originalIdx = p.fase === '16vos' ? sorted16vos.findIndex(x => x.id === p.id) : -1;
    const labelLocal = p.fase === '16vos' && originalIdx !== -1 && posiciones16vos[originalIdx] ? posiciones16vos[originalIdx].local : null;
    const labelVisitante = p.fase === '16vos' && originalIdx !== -1 && posiciones16vos[originalIdx] ? posiciones16vos[originalIdx].visitante : null;

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
  };

  const columns = [
    { title: '16vos', matches: left16vos },
    { title: '8vos', matches: left8vos },
    { title: 'Cuartos', matches: leftCuartos },
    { title: 'Semis', matches: leftSemis },
    { title: 'Final / 3er Puesto', matches: [], isCenter: true },
    { title: 'Semis', matches: rightSemis },
    { title: 'Cuartos', matches: rightCuartos },
    { title: '8vos', matches: right8vos },
    { title: '16vos', matches: right16vos },
  ];

  return (
    <div className="brackets-container" style={{ 
      display: 'flex', 
      gap: '2rem', 
      overflowX: 'auto', 
      padding: '2rem 0',
      alignItems: 'center' 
    }}>
      {columns.map((col, idx) => (
        <div key={idx} className="bracket-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '240px' }}>
          <h4 style={{ 
            textAlign: 'center', 
            fontSize: '0.7rem', 
            color: 'var(--primary)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em',
            marginBottom: '0.5rem'
          }}>
            {col.title}
          </h4>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-around', 
            flex: 1, 
            gap: '1.5rem', 
            minHeight: '680px' 
          }}>
            {col.isCenter ? (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4rem', height: '100%' }}>
                {finalMatch && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>FINAL</div>
                    {renderMatchCard(finalMatch)}
                  </div>
                )}
                {tercerPuestoMatch && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--outline)', fontWeight: 'bold' }}>TERCER PUESTO</div>
                    {renderMatchCard(tercerPuestoMatch)}
                  </div>
                )}
              </div>
            ) : (
              col.matches.map((p) => renderMatchCard(p))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
