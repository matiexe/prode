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
    return b.gf - a.gf;
  });
}

export async function obtenerClasificados16vos(): Promise<{ 
  primeros: Record<string, string>, 
  segundos: Record<string, string>, 
  mejoresTerceros: string[] 
}> {
  const grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const primeros: Record<string, string> = {};
  const segundos: Record<string, string> = {};
  const terceros: EquipoPosicion[] = [];

  for (const g of grupos) {
    const tabla = await calcularTablaGrupo('grupos', g);
    if (tabla.length >= 1) primeros[g] = tabla[0].equipo;
    if (tabla.length >= 2) segundos[g] = tabla[1].equipo;
    if (tabla.length >= 3) terceros.push(tabla[2]);
  }

  const mejoresTerceros = terceros
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      return b.gf - a.gf;
    })
    .slice(0, 8)
    .map(t => t.equipo);

  return { primeros, segundos, mejoresTerceros };
}

export async function cerrarFaseGrupos(): Promise<void> {
  const { primeros, segundos, mejoresTerceros } = await obtenerClasificados16vos();
  
  const partidos16vos = await Partido.findAll({
    where: { fase: '16vos' },
    order: [['fechaHora', 'ASC'], ['id', 'ASC']]
  });

  if (partidos16vos.length < 16) {
    throw new Error('No se han generado los 16 partidos de 16vos de final.');
  }

  const llaves = [
    { local: segundos['A'], visite: segundos['B'] }, // P73
    { local: primeros['A'], visite: mejoresTerceros[0] }, // P74
    { local: primeros['B'], visite: mejoresTerceros[1] }, // P75
    { local: primeros['C'], visite: mejoresTerceros[2] }, // P76
    { local: primeros['D'], visite: mejoresTerceros[3] }, // P77
    { local: primeros['E'], visite: segundos['F'] }, // P78
    { local: primeros['F'], visite: mejoresTerceros[4] }, // P79
    { local: primeros['G'], visite: mejoresTerceros[5] }, // P80
    { local: segundos['C'], visite: segundos['D'] }, // P81
    { local: primeros['H'], visite: segundos['J'] }, // P82
    { local: primeros['I'], visite: mejoresTerceros[6] }, // P83
    { local: primeros['J'], visite: segundos['L'] }, // P84
    { local: primeros['K'], visite: mejoresTerceros[7] }, // P85
    { local: primeros['L'], visite: segundos['G'] }, // P86 (Simplificado)
    { local: segundos['G'], visite: segundos['I'] }, // P87
    { local: segundos['E'], visite: segundos['H'] }, // P88
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
    order: [['fechaHora', 'ASC'], ['id', 'ASC']]
  });

  if (partidosActuales.some(p => p.estado !== 'finalizado')) {
    throw new Error(`Aun hay partidos pendientes en la fase ${faseActual}.`);
  }

  const ganadores = partidosActuales.map(p => p.ganadorNombre).filter(Boolean) as string[];

  const partidosSiguientes = await Partido.findAll({
    where: { fase: faseSiguiente },
    order: [['fechaHora', 'ASC'], ['id', 'ASC']]
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

  for (let i = 0; i < partidosSiguientes.length; i++) {
    const local = ganadores[i * 2];
    const visitante = ganadores[i * 2 + 1];

    await partidosSiguientes[i].update({
      equipoLocal: local || 'Por definir',
      equipoVisitante: visitante || 'Por definir'
    });
  }
}
