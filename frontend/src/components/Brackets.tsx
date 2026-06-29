import { useState, useMemo } from 'react';
import { getFlagUrl, getFlagSrcset } from '../utils/flags';
import copaDelMundoImg from '../assets/copadelmundo.png';
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

// Mapeo oficial de emparejamientos por índice ordenados por ID (desde torneo.service.ts)
const MAPEO_CRUCES = {
  '16vos': [ // De 16vos (16 partidos) a 8vos (8 partidos)
    { local: 1, visitante: 4 },   // P89: Ganador P74 (idx 1) vs Ganador P77 (idx 4)
    { local: 0, visitante: 2 },   // P90: Ganador P73 (idx 0) vs Ganador P75 (idx 2)
    { local: 3, visitante: 5 },   // P91: Ganador P76 (idx 3) vs Ganador P78 (idx 5)
    { local: 6, visitante: 7 },   // P92: Ganador P79 (idx 6) vs Ganador P80 (idx 7)
    { local: 10, visitante: 11 }, // P93: Ganador P83 (idx 10) vs Ganador P84 (idx 11)
    { local: 8, visitante: 9 },   // P94: Ganador P81 (idx 8) vs Ganador P82 (idx 9)
    { local: 13, visitante: 15 }, // P95: Ganador P86 (idx 13) vs Ganador P88 (idx 15)
    { local: 12, visitante: 14 }  // P96: Ganador P85 (idx 12) vs Ganador P87 (idx 14)
  ],
  '8vos': [ // De 8vos (8 partidos) a cuartos (4 partidos)
    { local: 0, visitante: 1 }, // P97: Ganador P89 vs P90
    { local: 4, visitante: 5 }, // P98: Ganador P93 vs P94
    { local: 2, visitante: 3 }, // P99: Ganador P91 vs P92
    { local: 6, visitante: 7 }  // P100: Ganador P95 vs P96
  ],
  'cuartos': [ // De cuartos (4 partidos) a semis (2 partidos)
    { local: 0, visitante: 1 }, // P101: Ganador P97 vs P98
    { local: 2, visitante: 3 }  // P102: Ganador P99 vs P100
  ]
};

// Mapeo circular de los 16 partidos a las 32 posiciones de la corona exterior.
// El orden está calculado de manera que las llaves nunca se crucen y se unan perfectamente hacia el centro.
const circularMapping16vos = [
  { index16vos: 1, localSlot: 0, visiteSlot: 31 }, // Germany (Match 74)
  { index16vos: 3, localSlot: 1, visiteSlot: 2 },  // Brazil vs Japan (Match 76)
  { index16vos: 5, localSlot: 3, visiteSlot: 4 },  // Ivory Coast vs Norway (Match 78)
  { index16vos: 6, localSlot: 5, visiteSlot: 6 },  // Mexico vs Ecuador (Match 79)
  { index16vos: 7, localSlot: 7, visiteSlot: 8 },  // England vs DR Congo (Match 80)
  { index16vos: 13, localSlot: 9, visiteSlot: 10 }, // Argentina vs Cape Verde (Match 86)
  { index16vos: 15, localSlot: 11, visiteSlot: 12 },// Australia vs Egypt (Match 88)
  { index16vos: 12, localSlot: 13, visiteSlot: 14 },// Switzerland vs Algeria (Match 85)
  { index16vos: 14, localSlot: 15, visiteSlot: 16 },// Croatia vs Portugal (Match 87)
  { index16vos: 9, localSlot: 17, visiteSlot: 18 },// Senegal vs Belgium (Match 82)
  { index16vos: 8, localSlot: 19, visiteSlot: 20 },// Bosnia vs USA (Match 81)
  { index16vos: 11, localSlot: 21, visiteSlot: 22 },// Austria vs Spain (Match 84)
  { index16vos: 10, localSlot: 23, visiteSlot: 24 },// Colombia vs Ghana (Match 83)
  { index16vos: 2, localSlot: 25, visiteSlot: 26 },// Morocco vs Netherlands (Match 75)
  { index16vos: 0, localSlot: 27, visiteSlot: 28 },// Canada vs South Africa (Match 73)
  { index16vos: 4, localSlot: 29, visiteSlot: 30 } // Sweden vs France (Match 77)
];

const averageAngle = (a1: number, a2: number): number => {
  let diff = a2 - a1;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  return a1 + diff / 2;
};

const getSweepFlag = (a1: number, a2: number): number => {
  let diff = a2 - a1;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  return diff > 0 ? 1 : 0;
};

export default function Brackets({ partidos }: BracketsProps) {
  const [viewMode, setViewMode] = useState<'circular' | 'classic'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'classic' : 'circular';
  });
  const [hoveredInfo, setHoveredInfo] = useState<{ title: string; desc: string; x: number; y: number } | null>(null);

  const sorted16vos = useMemo(() => partidos.filter(p => p.fase === '16vos').sort((a, b) => a.id - b.id), [partidos]);
  const sorted8vos = useMemo(() => partidos.filter(p => p.fase === '8vos').sort((a, b) => a.id - b.id), [partidos]);
  const sortedCuartos = useMemo(() => partidos.filter(p => p.fase === 'cuartos').sort((a, b) => a.id - b.id), [partidos]);
  const sortedSemis = useMemo(() => partidos.filter(p => p.fase === 'semis').sort((a, b) => a.id - b.id), [partidos]);
  
  const finalMatch = useMemo(() => partidos.find(p => p.fase === 'final'), [partidos]);
  const tercerPuestoMatch = useMemo(() => partidos.find(p => p.fase === '3er_puesto'), [partidos]);

  // --- VISTA CLÁSICA ---
  const left16vos = [1, 4, 0, 2, 10, 11, 8, 9].map(idx => sorted16vos[idx]).filter(Boolean);
  const left8vos = [0, 1, 4, 5].map(idx => sorted8vos[idx]).filter(Boolean);
  const leftCuartos = [0, 1].map(idx => sortedCuartos[idx]).filter(Boolean);
  const leftSemis = [0].map(idx => sortedSemis[idx]).filter(Boolean);

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


  // --- VISTA CIRCULAR MATEMÁTICA ---
  const circularData = useMemo(() => {
    if (sorted16vos.length < 16) return null;

    const step = (2 * Math.PI) / 32;
    const getAngle = (slot: number) => -Math.PI / 2 + (slot + 0.5) * step;

    // Radios de los círculos concéntricos
    const R0 = 380; // 16vos (32 equipos)
    const R1 = 280; // 8vos (16 clasificados)
    const R2 = 185; // Cuartos (8 clasificados)
    const R3 = 100; // Semis (4 clasificados)
    const R4 = 48;  // Final (2 clasificados)

    const nodes: any[] = [];
    const lines: any[] = [];

    // --- NIVEL 0: 16vos (32 equipos en R0) ---
    const level0Matches = circularMapping16vos.map((m) => {
      const match = sorted16vos[m.index16vos];
      const angleLocal = getAngle(m.localSlot);
      const angleVisite = getAngle(m.visiteSlot);
      const childAngle = averageAngle(angleLocal, angleVisite);

      const pLocalLabel = posiciones16vos[m.index16vos]?.local || "TBD";
      const pVisiteLabel = posiciones16vos[m.index16vos]?.visitante || "TBD";

      const localNode = {
        id: `m${match.id}-l`,
        x: R0 * Math.cos(angleLocal),
        y: R0 * Math.sin(angleLocal),
        angle: angleLocal,
        r: R0,
        equipo: match.equipoLocal,
        flag: getFlagUrl(match.equipoLocal),
        label: pLocalLabel,
        matchId: match.id,
        fase: '16vos'
      };

      const visiteNode = {
        id: `m${match.id}-v`,
        x: R0 * Math.cos(angleVisite),
        y: R0 * Math.sin(angleVisite),
        angle: angleVisite,
        r: R0,
        equipo: match.equipoVisitante,
        flag: getFlagUrl(match.equipoVisitante),
        label: pVisiteLabel,
        matchId: match.id,
        fase: '16vos'
      };

      nodes.push(localNode, visiteNode);

      // Dibujar conector radial + arco + stem hacia R1
      const R_mid = (R0 + R1) / 2;
      const x1_m = R_mid * Math.cos(angleLocal);
      const y1_m = R_mid * Math.sin(angleLocal);
      const x2_m = R_mid * Math.cos(angleVisite);
      const y2_m = R_mid * Math.sin(angleVisite);
      const x_c = R1 * Math.cos(childAngle);
      const y_c = R1 * Math.sin(childAngle);

      const localWon = match.estado === 'finalizado' && match.ganadorNombre === match.equipoLocal;
      const visiteWon = match.estado === 'finalizado' && match.ganadorNombre === match.equipoVisitante;
      const hasWinner = localWon || visiteWon;

      // Líneas del conector
      lines.push({
        path: `M ${localNode.x} ${localNode.y} L ${x1_m} ${y1_m}`,
        highlighted: localWon,
        color: 'var(--primary)'
      });
      lines.push({
        path: `M ${visiteNode.x} ${visiteNode.y} L ${x2_m} ${y2_m}`,
        highlighted: visiteWon,
        color: 'var(--primary)'
      });
      lines.push({
        path: `M ${x1_m} ${y1_m} A ${R_mid} ${R_mid} 0 0 ${getSweepFlag(angleLocal, angleVisite)} ${x2_m} ${y2_m}`,
        highlighted: hasWinner,
        color: 'var(--primary)'
      });
      lines.push({
        path: `M ${R_mid * Math.cos(childAngle)} ${R_mid * Math.sin(childAngle)} L ${x_c} ${y_c}`,
        highlighted: hasWinner,
        color: 'var(--primary)'
      });

      return {
        match,
        childAngle,
        winner: match.estado === 'finalizado' ? match.ganadorNombre : null
      };
    });

    // --- NIVEL 1: 8vos (16 clasificados en R1 -> 8 clasificados en R2) ---
    const level1Matches = MAPEO_CRUCES['16vos'].map((cruce, idx) => {
      const match = sorted8vos[idx];
      const parentLocal = level0Matches.find(m => m.match.id === sorted16vos[cruce.local]?.id);
      const parentVisite = level0Matches.find(m => m.match.id === sorted16vos[cruce.visitante]?.id);
      
      const angleLocal = parentLocal?.childAngle ?? 0;
      const angleVisite = parentVisite?.childAngle ?? 0;
      const childAngle = averageAngle(angleLocal, angleVisite);

      const localNode = {
        id: `m${match?.id || idx}-l`,
        x: R1 * Math.cos(angleLocal),
        y: R1 * Math.sin(angleLocal),
        angle: angleLocal,
        r: R1,
        equipo: match ? match.equipoLocal : 'Por definir',
        flag: match ? getFlagUrl(match.equipoLocal) : null,
        label: `Ganador P${sorted16vos[cruce.local]?.id || ''}`,
        matchId: match?.id,
        fase: '8vos'
      };

      const visiteNode = {
        id: `m${match?.id || idx}-v`,
        x: R1 * Math.cos(angleVisite),
        y: R1 * Math.sin(angleVisite),
        angle: angleVisite,
        r: R1,
        equipo: match ? match.equipoVisitante : 'Por definir',
        flag: match ? getFlagUrl(match.equipoVisitante) : null,
        label: `Ganador P${sorted16vos[cruce.visitante]?.id || ''}`,
        matchId: match?.id,
        fase: '8vos'
      };

      nodes.push(localNode, visiteNode);

      if (match) {
        const R_mid = (R1 + R2) / 2;
        const x1_m = R_mid * Math.cos(angleLocal);
        const y1_m = R_mid * Math.sin(angleLocal);
        const x2_m = R_mid * Math.cos(angleVisite);
        const y2_m = R_mid * Math.sin(angleVisite);
        const x_c = R2 * Math.cos(childAngle);
        const y_c = R2 * Math.sin(childAngle);

        const localWon = match.estado === 'finalizado' && match.ganadorNombre === match.equipoLocal;
        const visiteWon = match.estado === 'finalizado' && match.ganadorNombre === match.equipoVisitante;
        const hasWinner = localWon || visiteWon;

        lines.push({
          path: `M ${localNode.x} ${localNode.y} L ${x1_m} ${y1_m}`,
          highlighted: localWon,
          color: 'var(--primary)'
        });
        lines.push({
          path: `M ${visiteNode.x} ${visiteNode.y} L ${x2_m} ${y2_m}`,
          highlighted: visiteWon,
          color: 'var(--primary)'
        });
        lines.push({
          path: `M ${x1_m} ${y1_m} A ${R_mid} ${R_mid} 0 0 ${getSweepFlag(angleLocal, angleVisite)} ${x2_m} ${y2_m}`,
          highlighted: hasWinner,
          color: 'var(--primary)'
        });
        lines.push({
          path: `M ${R_mid * Math.cos(childAngle)} ${R_mid * Math.sin(childAngle)} L ${x_c} ${y_c}`,
          highlighted: hasWinner,
          color: 'var(--primary)'
        });
      }

      return {
        match,
        childAngle,
        winner: match?.estado === 'finalizado' ? match.ganadorNombre : null
      };
    });

    // --- NIVEL 2: Cuartos (8 clasificados en R2 -> 4 clasificados en R3) ---
    const level2Matches = MAPEO_CRUCES['8vos'].map((cruce, idx) => {
      const match = sortedCuartos[idx];
      const parentLocal = level1Matches.find(m => m.match?.id === sorted8vos[cruce.local]?.id);
      const parentVisite = level1Matches.find(m => m.match?.id === sorted8vos[cruce.visitante]?.id);
      
      const angleLocal = parentLocal?.childAngle ?? 0;
      const angleVisite = parentVisite?.childAngle ?? 0;
      const childAngle = averageAngle(angleLocal, angleVisite);

      const localNode = {
        id: `m${match?.id || idx}-l`,
        x: R2 * Math.cos(angleLocal),
        y: R2 * Math.sin(angleLocal),
        angle: angleLocal,
        r: R2,
        equipo: match ? match.equipoLocal : 'Por definir',
        flag: match ? getFlagUrl(match.equipoLocal) : null,
        label: `Ganador P${sorted8vos[cruce.local]?.id || ''}`,
        matchId: match?.id,
        fase: 'cuartos'
      };

      const visiteNode = {
        id: `m${match?.id || idx}-v`,
        x: R2 * Math.cos(angleVisite),
        y: R2 * Math.sin(angleVisite),
        angle: angleVisite,
        r: R2,
        equipo: match ? match.equipoVisitante : 'Por definir',
        flag: match ? getFlagUrl(match.equipoVisitante) : null,
        label: `Ganador P${sorted8vos[cruce.visitante]?.id || ''}`,
        matchId: match?.id,
        fase: 'cuartos'
      };

      nodes.push(localNode, visiteNode);

      if (match) {
        const R_mid = (R2 + R3) / 2;
        const x1_m = R_mid * Math.cos(angleLocal);
        const y1_m = R_mid * Math.sin(angleLocal);
        const x2_m = R_mid * Math.cos(angleVisite);
        const y2_m = R_mid * Math.sin(angleVisite);
        const x_c = R3 * Math.cos(childAngle);
        const y_c = R3 * Math.sin(childAngle);

        const localWon = match.estado === 'finalizado' && match.ganadorNombre === match.equipoLocal;
        const visiteWon = match.estado === 'finalizado' && match.ganadorNombre === match.equipoVisitante;
        const hasWinner = localWon || visiteWon;

        lines.push({
          path: `M ${localNode.x} ${localNode.y} L ${x1_m} ${y1_m}`,
          highlighted: localWon,
          color: 'var(--primary)'
        });
        lines.push({
          path: `M ${visiteNode.x} ${visiteNode.y} L ${x2_m} ${y2_m}`,
          highlighted: visiteWon,
          color: 'var(--primary)'
        });
        lines.push({
          path: `M ${x1_m} ${y1_m} A ${R_mid} ${R_mid} 0 0 ${getSweepFlag(angleLocal, angleVisite)} ${x2_m} ${y2_m}`,
          highlighted: hasWinner,
          color: 'var(--primary)'
        });
        lines.push({
          path: `M ${R_mid * Math.cos(childAngle)} ${R_mid * Math.sin(childAngle)} L ${x_c} ${y_c}`,
          highlighted: hasWinner,
          color: 'var(--primary)'
        });
      }

      return {
        match,
        childAngle,
        winner: match?.estado === 'finalizado' ? match.ganadorNombre : null
      };
    });

    // --- NIVEL 3: Semis (4 clasificados en R3 -> 2 clasificados en R4) ---
    const level3Matches = MAPEO_CRUCES['cuartos'].map((cruce, idx) => {
      const match = sortedSemis[idx];
      const parentLocal = level2Matches.find(m => m.match?.id === sortedCuartos[cruce.local]?.id);
      const parentVisite = level2Matches.find(m => m.match?.id === sortedCuartos[cruce.visitante]?.id);
      
      const angleLocal = parentLocal?.childAngle ?? 0;
      const angleVisite = parentVisite?.childAngle ?? 0;
      const childAngle = averageAngle(angleLocal, angleVisite);

      const localNode = {
        id: `m${match?.id || idx}-l`,
        x: R3 * Math.cos(angleLocal),
        y: R3 * Math.sin(angleLocal),
        angle: angleLocal,
        r: R3,
        equipo: match ? match.equipoLocal : 'Por definir',
        flag: match ? getFlagUrl(match.equipoLocal) : null,
        label: `Ganador P${sortedCuartos[cruce.local]?.id || ''}`,
        matchId: match?.id,
        fase: 'semis'
      };

      const visiteNode = {
        id: `m${match?.id || idx}-v`,
        x: R3 * Math.cos(angleVisite),
        y: R3 * Math.sin(angleVisite),
        angle: angleVisite,
        r: R3,
        equipo: match ? match.equipoVisitante : 'Por definir',
        flag: match ? getFlagUrl(match.equipoVisitante) : null,
        label: `Ganador P${sortedCuartos[cruce.visitante]?.id || ''}`,
        matchId: match?.id,
        fase: 'semis'
      };

      nodes.push(localNode, visiteNode);

      if (match) {
        const R_mid = (R3 + R4) / 2;
        const x1_m = R_mid * Math.cos(angleLocal);
        const y1_m = R_mid * Math.sin(angleLocal);
        const x2_m = R_mid * Math.cos(angleVisite);
        const y2_m = R_mid * Math.sin(angleVisite);
        const x_c = R4 * Math.cos(childAngle);
        const y_c = R4 * Math.sin(childAngle);

        const localWon = match.estado === 'finalizado' && match.ganadorNombre === match.equipoLocal;
        const visiteWon = match.estado === 'finalizado' && match.ganadorNombre === match.equipoVisitante;
        const hasWinner = localWon || visiteWon;

        lines.push({
          path: `M ${localNode.x} ${localNode.y} L ${x1_m} ${y1_m}`,
          highlighted: localWon,
          color: 'var(--primary)'
        });
        lines.push({
          path: `M ${visiteNode.x} ${visiteNode.y} L ${x2_m} ${y2_m}`,
          highlighted: visiteWon,
          color: 'var(--primary)'
        });
        lines.push({
          path: `M ${x1_m} ${y1_m} A ${R_mid} ${R_mid} 0 0 ${getSweepFlag(angleLocal, angleVisite)} ${x2_m} ${y2_m}`,
          highlighted: hasWinner,
          color: 'var(--primary)'
        });
        lines.push({
          path: `M ${R_mid * Math.cos(childAngle)} ${R_mid * Math.sin(childAngle)} L ${x_c} ${y_c}`,
          highlighted: hasWinner,
          color: 'var(--primary)'
        });
      }

      return {
        match,
        childAngle,
        winner: match?.estado === 'finalizado' ? match.ganadorNombre : null
      };
    });

    // --- NIVEL 4: Final (2 clasificados en R4 -> Campeón en 0,0) ---
    if (finalMatch && level3Matches.length > 0) {
      const angleLocal = Math.PI; // 9 o'clock (izquierda)
      const angleVisite = 0;      // 3 o'clock (derecha)

      const localNode = {
        id: `m${finalMatch.id}-l`,
        x: R4 * Math.cos(angleLocal),
        y: R4 * Math.sin(angleLocal),
        angle: angleLocal,
        r: R4,
        equipo: finalMatch.equipoLocal,
        flag: getFlagUrl(finalMatch.equipoLocal),
        label: `Ganador Semifinal 1`,
        matchId: finalMatch.id,
        fase: 'final'
      };

      const visiteNode = {
        id: `m${finalMatch.id}-v`,
        x: R4 * Math.cos(angleVisite),
        y: R4 * Math.sin(angleVisite),
        angle: angleVisite,
        r: R4,
        equipo: finalMatch.equipoVisitante,
        flag: getFlagUrl(finalMatch.equipoVisitante),
        label: `Ganador Semifinal 2`,
        matchId: finalMatch.id,
        fase: 'final'
      };

      nodes.push(localNode, visiteNode);

      const localWon = finalMatch.estado === 'finalizado' && finalMatch.ganadorNombre === finalMatch.equipoLocal;
      const visiteWon = finalMatch.estado === 'finalizado' && finalMatch.ganadorNombre === finalMatch.equipoVisitante;

      lines.push({
        path: `M ${localNode.x} ${localNode.y} L 0 0`,
        highlighted: localWon,
        color: '#ffb300'
      });
      lines.push({
        path: `M ${visiteNode.x} ${visiteNode.y} L 0 0`,
        highlighted: visiteWon,
        color: '#ffb300'
      });
    }

    return { nodes, lines };
  }, [sorted16vos, sorted8vos, sortedCuartos, sortedSemis, finalMatch]);

  const championNode = useMemo(() => {
    if (!finalMatch || finalMatch.estado !== 'finalizado') return null;
    return {
      equipo: finalMatch.ganadorNombre,
      flag: finalMatch.ganadorNombre ? getFlagUrl(finalMatch.ganadorNombre) : null
    };
  }, [finalMatch]);

  return (
    <div className="brackets-wrapper" style={{ width: '100%' }}>
      {/* Switcher de Vista */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '0.5rem', 
        marginBottom: '2.5rem',
        background: 'var(--surface-container-low)',
        padding: '6px',
        borderRadius: '12px',
        width: 'fit-content',
        margin: '0 auto 2.5rem',
        border: '1px solid var(--border)'
      }}>
        <button 
          onClick={() => setViewMode('circular')} 
          style={{
            border: 'none',
            background: viewMode === 'circular' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'circular' ? 'var(--on-primary)' : 'var(--text)',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontFamily: 'Anybody',
            fontWeight: 700,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>trip_origin</span>
          Circular (Oficial)
        </button>
        <button 
          onClick={() => setViewMode('classic')} 
          style={{
            border: 'none',
            background: viewMode === 'classic' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'classic' ? 'var(--on-primary)' : 'var(--text)',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontFamily: 'Anybody',
            fontWeight: 700,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.2s'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>splitscreen</span>
          Columnas Clásico
        </button>
      </div>

      {viewMode === 'circular' && circularData ? (
        <div style={{ position: 'relative', width: '100%', maxWidth: '880px', margin: '0 auto', background: 'radial-gradient(circle, rgba(177, 198, 249, 0.03) 0%, rgba(0,0,0,0) 70%)' }}>
          <div style={{ padding: '0.5rem' }}>
            <svg viewBox="-510 -510 1020 1020" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <clipPath id="circle-badge-clip">
                  <circle cx="0" cy="0" r="14" />
                </clipPath>
                <clipPath id="circle-badge-clip-large">
                  <circle cx="0" cy="0" r="22" />
                </clipPath>
                <clipPath id="circle-badge-clip-center">
                  <circle cx="0" cy="0" r="38" />
                </clipPath>
                <radialGradient id="glow-gold" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffb300" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ffb300" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="glow-primary" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </radialGradient>
              </defs>

              <circle cx="0" cy="0" r="380" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="5,5" />
              <circle cx="0" cy="0" r="280" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="5,5" />
              <circle cx="0" cy="0" r="185" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="5,5" />
              <circle cx="0" cy="0" r="100" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="5,5" />

              {/* Primero las líneas apagadas */}
              {circularData.lines.map((line, idx) => !line.highlighted && (
                <path
                  key={`bg-line-${idx}`}
                  d={line.path}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ))}

              {/* Las líneas activadas encima */}
              {circularData.lines.map((line, idx) => line.highlighted && (
                <g key={`hl-line-${idx}`}>
                  <path
                    d={line.path}
                    fill="none"
                    stroke={line.color || 'var(--primary)'}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity="0.3"
                    filter="blur(1.5px)"
                  />
                  <path
                    d={line.path}
                    fill="none"
                    stroke={line.color || 'var(--primary)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
              ))}

              {/* Renders de Nodos */}
              {circularData.nodes.map((node) => {
                const deg = node.angle * (180 / Math.PI);
                let rotateText = deg;
                let textAnchor: "start" | "end" = 'start';
                let offsetText = 22;

                if (deg > 90 || deg < -90) {
                  rotateText = deg + 180;
                  textAnchor = 'end';
                  offsetText = -22;
                }

                const isOuter = node.r === 380;
                const hasTeam = node.equipo !== 'Por definir';
                const match = partidos.find(p => p.id === node.matchId);

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      if (!match) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredInfo({
                        title: `${match.equipoLocal} vs ${match.equipoVisitante}`,
                        desc: `${match.fase.toUpperCase()} • ${match.estado === 'finalizado' ? `Resultado: ${match.golesLocal}-${match.golesVisitante}` : 'Pendiente'}`,
                        x: rect.left + window.scrollX + rect.width / 2,
                        y: rect.top + window.scrollY - 12
                      });
                    }}
                    onMouseLeave={() => setHoveredInfo(null)}
                  >
                    {hasTeam && (
                      <circle cx="0" cy="0" r="18" fill={node.r === 48 ? 'url(#glow-gold)' : 'url(#glow-primary)'} />
                    )}

                    <circle 
                      cx="0" 
                      cy="0" 
                      r="15" 
                      fill="#151719" 
                      stroke={hasTeam ? (node.r === 48 ? '#ffb300' : 'var(--primary)') : 'rgba(255,255,255,0.1)'} 
                      strokeWidth="1.5" 
                    />

                    {hasTeam && node.flag ? (
                      <image 
                        href={node.flag} 
                        x="-14" 
                        y="-14" 
                        width="28" 
                        height="28" 
                        clipPath="url(#circle-badge-clip)"
                      />
                    ) : (
                      <text 
                        x="0" 
                        y="4" 
                        textAnchor="middle" 
                        fill="rgba(255,255,255,0.3)" 
                        style={{ fontSize: '9px', fontWeight: 600, fontFamily: 'monospace' }}
                      >
                        {node.label.match(/\d+°/g) ? node.label.replace(' Grupo ', '') : 'TBD'}
                      </text>
                    )}

                    {isOuter && hasTeam && (
                      <g transform={`rotate(${rotateText})`}>
                        <text
                          className="circular-team-label"
                          x={offsetText}
                          y="4"
                          textAnchor={textAnchor}
                          fill={hasTeam ? 'var(--text)' : 'var(--outline)'}
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            fontFamily: 'Anybody',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                          }}
                        >
                          {node.equipo}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Copa Central */}
              <circle cx="0" cy="0" r="60" fill="url(#glow-gold)" opacity="0.6" />
              
              {championNode ? (
                <g 
                  transform="translate(0, 0)"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredInfo({
                      title: `🏆 ¡CAMPEÓN DEL MUNDO!`,
                      desc: `${championNode.equipo}`,
                      x: rect.left + window.scrollX + rect.width / 2,
                      y: rect.top + window.scrollY - 12
                    });
                  }}
                  onMouseLeave={() => setHoveredInfo(null)}
                >
                  <circle cx="0" cy="0" r="24" fill="#151719" stroke="#ffb300" strokeWidth="1.5" />
                  <image 
                    href={championNode.flag || ''} 
                    x="-22" 
                    y="-22" 
                    width="44" 
                    height="44" 
                    clipPath="url(#circle-badge-clip-large)"
                  />
                  <circle cx="0" cy="0" r="26" fill="none" stroke="#ffb300" strokeWidth="2" strokeDasharray="3,3" />
                </g>
              ) : (
                <image 
                  href={copaDelMundoImg} 
                  x="-36" 
                  y="-55" 
                  width="72" 
                  height="110" 
                  style={{ 
                    filter: 'drop-shadow(0 0 16px rgba(255, 179, 0, 0.85)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.35))',
                    pointerEvents: 'none' 
                  }}
                />
              )}
            </svg>
          </div>

          {/* Tooltip */}
          {hoveredInfo && (
            <div 
              style={{
                position: 'absolute',
                left: `${hoveredInfo.x - 220}px`,
                top: `${hoveredInfo.y - 80}px`,
                transform: 'translate(-50%, -100%)',
                background: 'rgba(21, 23, 25, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--primary)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                zIndex: 100,
                width: '240px',
                pointerEvents: 'none'
              }}
              className="animate-fade-in"
            >
              <h4 style={{ margin: 0, fontFamily: 'Anybody', fontSize: '0.85rem', color: 'var(--text)' }}>
                {hoveredInfo.title}
              </h4>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--primary)' }}>
                {hoveredInfo.desc}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* --- VISTA COLUMNAS CLÁSICA --- */
        <div className="brackets-container" style={{ minHeight: '680px' }}>
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
      )}
    </div>
  );
}
