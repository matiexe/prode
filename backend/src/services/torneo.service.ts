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

  // Ordenar por Puntos, luego Diferencia de Gol, luego Goles a Favor
  return Object.values(tabla).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    return b.gf - a.gf;
  });
}

export async function obtenerClasificados16vos(): Promise<{ directos: string[], mejoresTerceros: string[] }> {
  const grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const directos: string[] = [];
  const terceros: EquipoPosicion[] = [];

  for (const g of grupos) {
    const tabla = await calcularTablaGrupo('grupos', g);
    if (tabla.length >= 1) directos.push(tabla[0].equipo);
    if (tabla.length >= 2) directos.push(tabla[1].equipo);
    if (tabla.length >= 3) terceros.push(tabla[2]);
  }

  // Ordenar terceros para sacar los 8 mejores
  const mejoresTerceros = terceros
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      return b.gf - a.gf;
    })
    .slice(0, 8)
    .map(t => t.equipo);

  return { directos, mejoresTerceros };
}

