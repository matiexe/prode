import { useState, useEffect, useMemo } from 'react';
import { listarPartidos } from '../api/partidos';
import TablaGrupo from '../components/TablaGrupo';
import Brackets from '../components/Brackets';
import type { EquipoPosicion } from '../components/TablaGrupo';
import type { Partido } from '../types';

// Función auxiliar para calcular las posiciones de un grupo basado en cualquier conjunto de partidos
function calcularTablaConPartidos(partidos: Partido[], grupoNombre: string): EquipoPosicion[] {
  const tabla: Record<string, EquipoPosicion> = {};
  const initEquipo = (nombre: string) => {
    if (!tabla[nombre]) {
      tabla[nombre] = { equipo: nombre, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
    }
  };

  const partidosGrupo = partidos.filter(p => p.fase === 'grupos' && p.grupo === grupoNombre);
  
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
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.equipo.localeCompare(b.equipo);
  });
}

export default function GruposPage() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'grupos' | 'llave'>('llave'); // Por defecto 'llave'

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

  const tablasPorGrupo = useMemo(() => {
    return grupos.map(g => ({
      nombre: g,
      posiciones: calcularTablaConPartidos(partidos, g)
    }));
  }, [partidos]);

  return (
    <div className="page groups-page" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '2.5rem' }}>table_chart</span>
          Posiciones y Llave Final
        </h1>
        <p className="subtitle">Visualiza la tabla de posiciones de grupos y el desarrollo de la llave final en tiempo real.</p>
      </header>

      {/* Selector de Pestañas */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.5rem'
      }}>
        <button 
          onClick={() => setVista('llave')} 
          style={{
            border: 'none',
            background: 'none',
            color: vista === 'llave' ? 'var(--primary)' : 'var(--outline)',
            cursor: 'pointer',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontFamily: 'Anybody',
            fontWeight: 700,
            borderBottom: vista === 'llave' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          Llave Final
        </button>
        <button 
          onClick={() => setVista('grupos')} 
          style={{
            border: 'none',
            background: 'none',
            color: vista === 'grupos' ? 'var(--primary)' : 'var(--outline)',
            cursor: 'pointer',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontFamily: 'Anybody',
            fontWeight: 700,
            borderBottom: vista === 'grupos' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          Fase de Grupos
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="material-symbols-outlined spin" style={{ color: 'var(--primary)', fontSize: '2.5rem' }}>sync</span>
        </div>
      ) : vista === 'grupos' ? (
        <div className="grupos-grid">
          {tablasPorGrupo.map((tg) => (
            <TablaGrupo 
              key={tg.nombre} 
              titulo={`Grupo ${tg.nombre}`} 
              posiciones={tg.posiciones} 
            />
          ))}
        </div>
      ) : (
        <div className="brackets-section">
          <Brackets partidos={partidos} />
        </div>
      )}
    </div>
  );
}
