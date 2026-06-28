import { Partido } from '../models/Partido';
import { Op } from 'sequelize';

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

export async function calcularTablaGrupo(fase: string, grupo: string): Promise<EquipoPosicion[]> {
  const partidos = await Partido.findAll({
    where: {
      fase,
      grupo,
      estado: 'finalizado'
    }
  });

  const tabla: Record<string, EquipoPosicion> = {};

  const initEquipo = (nombre: string) => {
    if (!tabla[nombre]) {
      tabla[nombre] = { equipo: nombre, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
    }
  };

  for (const p of partidos) {
    if (p.golesLocal === null || p.golesVisitante === null) continue;

    initEquipo(p.equipoLocal);
    initEquipo(p.equipoVisitante);

    const local = tabla[p.equipoLocal];
    const visit = tabla[p.equipoVisitante];

    local.pj++;
    visit.pj++;
    local.gf += p.golesLocal;
    local.gc += p.golesVisitante;
    visit.gf += p.golesVisitante;
    visit.gc += p.golesLocal;

    if (p.golesLocal > p.golesVisitante) {
      local.pg++;
      local.pts += 3;
      visit.pp++;
    } else if (p.golesLocal < p.golesVisitante) {
      visit.pg++;
      visit.pts += 3;
      local.pp++;
    } else {
      local.pe++;
      visit.pe++;
      local.pts += 1;
      visit.pts += 1;
    }
    
    local.dg = local.gf - local.gc;
    visit.dg = visit.gf - visit.gc;
  }

  return Object.values(tabla).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.equipo.localeCompare(b.equipo);
  });
}

export async function obtenerClasificados16vos(): Promise<{ 
  primeros: Record<string, string>, 
  segundos: Record<string, string>, 
  mejoresTerceros: string[],
  mejoresTercerosInfo?: { equipo: string, grupo: string }[],
  tercerosDeCadaGrupo?: Record<string, string>
}> {
  const grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const primeros: Record<string, string> = {};
  const segundos: Record<string, string> = {};
  const terceros: (EquipoPosicion & { grupo: string })[] = [];
  const tercerosDeCadaGrupo: Record<string, string> = {};

  for (const g of grupos) {
    const tabla = await calcularTablaGrupo('grupos', g);
    if (tabla.length >= 1) primeros[g] = tabla[0].equipo;
    if (tabla.length >= 2) segundos[g] = tabla[1].equipo;
    if (tabla.length >= 3) {
      terceros.push({ ...tabla[2], grupo: g });
      tercerosDeCadaGrupo[g] = tabla[2].equipo;
    }
  }

  const mejoresTercerosInfo = terceros
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.equipo.localeCompare(b.equipo);
    })
    .slice(0, 8);

  const mejoresTerceros = mejoresTercerosInfo.map(t => t.equipo);

  return { primeros, segundos, mejoresTerceros, mejoresTercerosInfo, tercerosDeCadaGrupo };
}

export async function cerrarFaseGrupos(): Promise<void> {
  const { primeros, segundos, mejoresTerceros, mejoresTercerosInfo, tercerosDeCadaGrupo } = await obtenerClasificados16vos();
  
  const partidos16vos = await Partido.findAll({
    where: { fase: '16vos' },
    order: [['fechaHora', 'ASC'], ['id', 'ASC']]
  });

  if (partidos16vos.length < 16) {
    throw new Error('No se han generado los 16 partidos de 16vos de final.');
  }

  // Obtener la combinación de grupos de los mejores terceros
  let combo: any = null;
  if (mejoresTercerosInfo && mejoresTercerosInfo.length === 8) {
    const gruposQueClasifican = mejoresTercerosInfo.map(t => t.grupo).sort().join('');
    try {
      const combinaciones = require('../data/combinaciones.json');
      combo = combinaciones.find((c: any) => c.groups === gruposQueClasifican);
      console.log(`[CERRAR-FASE] Combinación de terceros detectada: ${gruposQueClasifican}. Combo encontrado:`, !!combo);
    } catch (err) {
      console.error('[CERRAR-FASE] Error al cargar combinaciones.json:', err);
    }
  }

  const getTerceroGrupo = (grupoSlot: string, fallbackIdx: number): string => {
    if (combo && combo.assignments && combo.assignments[grupoSlot]) {
      const grupoOrigen = combo.assignments[grupoSlot];
      return tercerosDeCadaGrupo?.[grupoOrigen] || 'Por definir';
    }
    return mejoresTerceros[fallbackIdx] || 'Por definir';
  };

  const llaves = [
    { local: segundos['A'], visite: segundos['B'] }, // P73: 2A vs 2B
    { local: primeros['E'], visite: getTerceroGrupo('1E', 0) }, // P74: 1E vs 3rd
    { local: primeros['F'], visite: segundos['C'] }, // P75: 1F vs 2C
    { local: primeros['C'], visite: segundos['F'] }, // P76: 1C vs 2F
    { local: primeros['I'], visite: getTerceroGrupo('1I', 1) }, // P77: 1I vs 3rd
    { local: segundos['E'], visite: segundos['I'] }, // P78: 2E vs 2I
    { local: primeros['A'], visite: getTerceroGrupo('1A', 2) }, // P79: 1A vs 3rd
    { local: primeros['L'], visite: getTerceroGrupo('1L', 3) }, // P80: 1L vs 3rd
    { local: primeros['D'], visite: getTerceroGrupo('1D', 4) }, // P81: 1D vs 3rd
    { local: primeros['G'], visite: getTerceroGrupo('1G', 5) }, // P82: 1G vs 3rd
    { local: segundos['K'], visite: segundos['L'] }, // P83: 2K vs 2L
    { local: primeros['H'], visite: segundos['J'] }, // P84: 1H vs 2J
    { local: primeros['B'], visite: getTerceroGrupo('1B', 6) }, // P85: 1B vs 3rd
    { local: primeros['J'], visite: segundos['H'] }, // P86: 1J vs 2H (Argentina vs 2H)
    { local: primeros['K'], visite: getTerceroGrupo('1K', 7) }, // P87: 1K vs 3rd
    { local: segundos['D'], visite: segundos['G'] }, // P88: 2D vs 2G
  ];

  for (let i = 0; i < 16; i++) {
    await partidos16vos[i].update({
      equipoLocal: llaves[i].local || 'Por definir',
      equipoVisitante: llaves[i].visite || 'Por definir'
    });
  }
}

export async function cerrarFaseEliminatoria(faseActual: string): Promise<void> {
  const fasesOrdenadas = ['grupos', '16vos', '8vos', 'cuartos', 'semis', 'final'];
  const currentIndex = fasesOrdenadas.indexOf(faseActual);
  
  if (currentIndex === -1 || currentIndex === fasesOrdenadas.length - 1) {
    throw new Error('Fase invalida para cerrar o es la final.');
  }

  const faseSiguiente = fasesOrdenadas[currentIndex + 1];

  const partidosActuales = await Partido.findAll({
    where: { fase: faseActual },
    order: [['id', 'ASC']]
  });

  if (partidosActuales.some(p => p.estado !== 'finalizado')) {
    throw new Error(`Aun hay partidos pendientes en la fase ${faseActual}.`);
  }

  const partidosSiguientes = await Partido.findAll({
    where: { fase: faseSiguiente },
    order: [['id', 'ASC']]
  });

  if (partidosSiguientes.length === 0) {
    throw new Error(`No hay partidos generados para la fase ${faseSiguiente}.`);
  }

  if (faseActual === 'semis') {
    const partido3erPuesto = await Partido.findOne({ where: { fase: '3er_puesto' } });
    const partidoFinal = await Partido.findOne({ where: { fase: 'final' } });

    if (!partidoFinal || !partido3erPuesto) {
      throw new Error('No se encontro el partido de la Final o del 3er Puesto.');
    }

    const ganadores = partidosActuales.map(p => p.ganadorNombre).filter(Boolean) as string[];
    const perdedores = partidosActuales.map(p => 
      p.ganadorNombre === p.equipoLocal ? p.equipoVisitante : p.equipoLocal
    );

    await partido3erPuesto.update({
      equipoLocal: perdedores[0],
      equipoVisitante: perdedores[1]
    });

    await partidoFinal.update({
      equipoLocal: ganadores[0],
      equipoVisitante: ganadores[1]
    });

    return;
  }

  // Mapeo oficial de emparejamientos del Mundial 2026 por índices ordenados por ID
  const MAPEO_CRUCES: Record<string, { local: number, visitante: number }[]> = {
    '16vos': [ // Mapea de 16vos (16 partidos) a 8vos (8 partidos)
      { local: 1, visitante: 4 },   // P89: Ganador P74 (idx 1) vs Ganador P77 (idx 4)
      { local: 0, visitante: 2 },   // P90: Ganador P73 (idx 0) vs Ganador P75 (idx 2)
      { local: 3, visitante: 5 },   // P91: Ganador P76 (idx 3) vs Ganador P78 (idx 5)
      { local: 6, visitante: 7 },   // P92: Ganador P79 (idx 6) vs Ganador P80 (idx 7)
      { local: 10, visitante: 11 }, // P93: Ganador P83 (idx 10) vs Ganador P84 (idx 11)
      { local: 8, visitante: 9 },   // P94: Ganador P81 (idx 8) vs Ganador P82 (idx 9)
      { local: 13, visitante: 15 }, // P95: Ganador P86 (idx 13) vs Ganador P88 (idx 15)
      { local: 12, visitante: 14 }  // P96: Ganador P85 (idx 12) vs Ganador P87 (idx 14)
    ],
    '8vos': [ // Mapea de 8vos (8 partidos) a cuartos (4 partidos)
      { local: 0, visitante: 1 }, // P97: Ganador P89 (idx 0) vs Ganador P90 (idx 1)
      { local: 4, visitante: 5 }, // P98: Ganador P93 (idx 4) vs Ganador P94 (idx 5)
      { local: 2, visitante: 3 }, // P99: Ganador P91 (idx 2) vs Ganador P92 (idx 3)
      { local: 6, visitante: 7 }  // P100: Ganador P95 (idx 6) vs Ganador P96 (idx 7)
    ],
    'cuartos': [ // Mapea de cuartos (4 partidos) a semis (2 partidos)
      { local: 0, visitante: 1 }, // P101: Ganador P97 (idx 0) vs Ganador P98 (idx 1)
      { local: 2, visitante: 3 }  // P102: Ganador P99 (idx 2) vs Ganador P100 (idx 3)
    ]
  };

  const cruces = MAPEO_CRUCES[faseActual];
  if (!cruces) {
    throw new Error(`Fase ${faseActual} no configurada para cruces automáticos.`);
  }

  for (let i = 0; i < partidosSiguientes.length; i++) {
    const cruce = cruces[i];
    const local = partidosActuales[cruce.local]?.ganadorNombre;
    const visitante = partidosActuales[cruce.visitante]?.ganadorNombre;

    await partidosSiguientes[i].update({
      equipoLocal: local || 'Por definir',
      equipoVisitante: visitante || 'Por definir'
    });
  }
}

export async function propagarProgresoLlave(partido: Partido): Promise<void> {
  const id = partido.id;
  const ganador = partido.ganadorNombre || 'Por definir';

  // Si el partido no está finalizado, no propagamos nada.
  if (partido.estado !== 'finalizado') return;

  // Mapeo directo de ID de partido actual a ID de partido siguiente y rol (local/visitante)
  const MAPEO_PROGRESION: Record<number, { nextId: number, rol: 'local' | 'visitante' }> = {
    // 16vos -> 8vos
    74: { nextId: 89, rol: 'local' },
    77: { nextId: 89, rol: 'visitante' },
    73: { nextId: 90, rol: 'local' },
    75: { nextId: 90, rol: 'visitante' },
    76: { nextId: 91, rol: 'local' },
    78: { nextId: 91, rol: 'visitante' },
    79: { nextId: 92, rol: 'local' },
    80: { nextId: 92, rol: 'visitante' },
    83: { nextId: 93, rol: 'local' },
    84: { nextId: 93, rol: 'visitante' },
    81: { nextId: 94, rol: 'local' },
    82: { nextId: 94, rol: 'visitante' },
    86: { nextId: 95, rol: 'local' },
    88: { nextId: 95, rol: 'visitante' },
    85: { nextId: 96, rol: 'local' },
    87: { nextId: 96, rol: 'visitante' },

    // 8vos -> cuartos
    89: { nextId: 97, rol: 'local' },
    90: { nextId: 97, rol: 'visitante' },
    93: { nextId: 98, rol: 'local' },
    94: { nextId: 98, rol: 'visitante' },
    91: { nextId: 99, rol: 'local' },
    92: { nextId: 99, rol: 'visitante' },
    95: { nextId: 100, rol: 'local' },
    96: { nextId: 100, rol: 'visitante' },

    // cuartos -> semis
    97: { nextId: 101, rol: 'local' },
    98: { nextId: 101, rol: 'visitante' },
    99: { nextId: 102, rol: 'local' },
    100: { nextId: 102, rol: 'visitante' }
  };

  const progresion = MAPEO_PROGRESION[id];
  if (progresion) {
    const nextMatch = await Partido.findByPk(progresion.nextId);
    if (nextMatch) {
      const updateData = progresion.rol === 'local' 
        ? { equipoLocal: ganador } 
        : { equipoVisitante: ganador };
      await nextMatch.update(updateData);
      console.log(`[PROGRESION] Propagado ganador de P${id} (${ganador}) a P${progresion.nextId} como ${progresion.rol}.`);
    }
  } else if (id === 101 || id === 102) {
    // semis -> final y 3er puesto
    const partido3erPuesto = await Partido.findByPk(103);
    const partidoFinal = await Partido.findByPk(104);
    
    const perdedor = ganador === partido.equipoLocal ? partido.equipoVisitante : partido.equipoLocal;

    if (id === 101) {
      if (partidoFinal) await partidoFinal.update({ equipoLocal: ganador });
      if (partido3erPuesto) await partido3erPuesto.update({ equipoLocal: perdedor });
    } else {
      if (partidoFinal) await partidoFinal.update({ equipoVisitante: ganador });
      if (partido3erPuesto) await partido3erPuesto.update({ equipoVisitante: perdedor });
    }
    console.log(`[PROGRESION] Propagados finalista (${ganador}) y 3er puesto (${perdedor}) desde P${id}.`);
  }
}
