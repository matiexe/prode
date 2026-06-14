import { useState, useEffect, useMemo } from 'react';
import { listarPartidos } from '../api/partidos';
import TablaGrupo from '../components/TablaGrupo';
import type { EquipoPosicion } from '../components/TablaGrupo';
import type { Partido } from '../types';

export default function GruposPage() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await listarPartidos();
        setPartidos(data);
      } catch (err) {
        console.error('Error al cargar partidos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  const calcularTabla = (grupoNombre: string) => {
    const tabla: Record<string, EquipoPosicion> = {};
    const initEquipo = (nombre: string) => {
      if (!tabla[nombre]) {
        tabla[nombre] = { equipo: nombre, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
      }
    };

    // Solo tomamos partidos de grupos que estén finalizados
    const partidosGrupo = partidos.filter(p => p.fase === 'grupos' && p.grupo === grupoNombre);
    
    // Primero inicializamos todos los equipos del grupo para que aparezcan en la tabla
    partidosGrupo.forEach(p => {
      initEquipo(p.equipoLocal);
      initEquipo(p.equipoVisitante);
    });

    partidosGrupo.filter(p => p.estado === 'finalizado').forEach(p => {
      const { golesLocal, golesVisitante, equipoLocal, equipoVisitante } = p;
      if (golesLocal === null || golesVisitante === null) return;

      const local = tabla[equipoLocal];
      const visit = tabla[equipoVisitante];

      local.pj++;
      visit.pj++;
      local.gf += golesLocal;
      local.gc += golesVisitante;
      visit.gf += golesVisitante;
      visit.gc += golesLocal;

      if (golesLocal > golesVisitante) {
        local.pg++;
        local.pts += 3;
        visit.pp++;
      } else if (golesLocal < golesVisitante) {
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
    });

    return Object.values(tabla).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      return b.gf - a.gf;
    });
  };

  const tablasPorGrupo = useMemo(() => {
    return grupos.map(g => ({
      nombre: g,
      posiciones: calcularTabla(g)
    }));
  }, [partidos]);

  return (
    <div className="page groups-page">
      <header className="page-header" style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '2rem' }}>table_chart</span>
          Tablas de Posiciones
        </h1>
        <p className="subtitle">Sigue el avance de los 12 grupos del Mundial 2026.</p>
      </header>

      {loading ? (
        <div className="grupos-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-card" style={{ height: '300px' }}></div>
          ))}
        </div>
      ) : (
        <div className="grupos-grid">
          {tablasPorGrupo.map((tg) => (
            <TablaGrupo 
              key={tg.nombre} 
              titulo={`Grupo ${tg.nombre}`} 
              posiciones={tg.posiciones} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
