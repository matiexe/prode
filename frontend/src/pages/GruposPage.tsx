import { useState, useEffect, useMemo } from 'react';
import { listarPartidos } from '../api/partidos';
import TablaGrupo from '../components/TablaGrupo';
import Brackets from '../components/Brackets';
import type { EquipoPosicion } from '../components/TablaGrupo';
import type { Partido } from '../types';
import combinaciones from '../utils/combinaciones.json';

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

// Función para calcular y proyectar los cruces de 16vos de final basándose en el estado de los grupos
function simular16vosDeFinal(partidosBase: Partido[]): Partido[] {
  const partidosSim = partidosBase.map(p => ({ ...p }));

  const grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const primeros: Record<string, string> = {};
  const segundos: Record<string, string> = {};
  const terceros: (EquipoPosicion & { grupo: string })[] = [];
  const tercerosDeCadaGrupo: Record<string, string> = {};

  for (const g of grupos) {
    const tabla = calcularTablaConPartidos(partidosSim, g);
    if (tabla.length >= 1) primeros[g] = tabla[0].equipo;
    if (tabla.length >= 2) segundos[g] = tabla[1].equipo;
    if (tabla.length >= 3) {
      terceros.push({ ...tabla[2], grupo: g });
      tercerosDeCadaGrupo[g] = tabla[2].equipo;
    }
  }

  // Determinar los 8 mejores terceros utilizando criterios FIFA
  const mejoresTercerosInfo = terceros
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.equipo.localeCompare(b.equipo);
    })
    .slice(0, 8);

  const mejoresTerceros = mejoresTercerosInfo.map(t => t.equipo);

  // Obtener la combinación de grupos de los mejores terceros
  let combo: any = null;
  if (mejoresTercerosInfo.length === 8) {
    const gruposQueClasifican = mejoresTercerosInfo.map(t => t.grupo).sort().join('');
    combo = (combinaciones as any[]).find((c: any) => c.groups === gruposQueClasifican);
  }

  const getTerceroGrupo = (grupoSlot: string, fallbackIdx: number): string => {
    if (combo && combo.assignments && combo.assignments[grupoSlot]) {
      const grupoOrigen = combo.assignments[grupoSlot];
      return tercerosDeCadaGrupo[grupoOrigen] || 'Por definir';
    }
    return mejoresTerceros[fallbackIdx] || 'Por definir';
  };

  // Mapear los cruces oficiales del Mundial 2026 para 16vos
  const llaves16vos = [
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

  const partidos16vos = partidosSim.filter(p => p.fase === '16vos').sort((a, b) => a.id - b.id);
  partidos16vos.forEach((p, idx) => {
    if (llaves16vos[idx]) {
      p.equipoLocal = llaves16vos[idx].local || 'Por definir';
      p.equipoVisitante = llaves16vos[idx].visite || 'Por definir';
    }
  });

  return partidosSim;
}


export default function GruposPage() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'grupos' | 'llave'>('grupos');
  const [partidosSimulados, setPartidosSimulados] = useState<Partido[] | null>(null);

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

  const partidosParaBrackets = useMemo(() => {
    return partidosSimulados || partidos;
  }, [partidosSimulados, partidos]);

  const handleSimular = () => {
    const sim = simular16vosDeFinal(partidos);
    setPartidosSimulados(sim);
  };

  const handleRestablecer = () => {
    setPartidosSimulados(null);
  };

  return (
    <div className="page groups-page" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '2.5rem' }}>table_chart</span>
          Posiciones y Llave Final
        </h1>
        <p className="subtitle">Visualiza la tabla de grupos y el desarrollo de la fase de eliminación directa.</p>
      </header>

      <div className="view-selector" style={{ 
        display: 'inline-flex', 
        background: 'var(--surface-container-low)', 
        border: '1px solid var(--border)', 
        borderRadius: '12px', 
        padding: '4px', 
        gap: '4px',
        marginBottom: '2rem'
      }}>
        <button 
          onClick={() => setVista('grupos')} 
          style={{ 
            border: 'none', 
            background: vista === 'grupos' ? 'rgba(177, 198, 249, 0.15)' : 'transparent',
            color: vista === 'grupos' ? 'var(--primary)' : 'var(--outline)',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontFamily: 'Anybody',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.2s'
          }}
        >
          Fase de Grupos
        </button>
        <button 
          onClick={() => setVista('llave')} 
          style={{ 
            border: 'none', 
            background: vista === 'llave' ? 'rgba(177, 198, 249, 0.15)' : 'transparent',
            color: vista === 'llave' ? 'var(--primary)' : 'var(--outline)',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontFamily: 'Anybody',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            transition: 'all 0.2s'
          }}
        >
          Llave Final
        </button>
      </div>

      {loading ? (
        <div className="grupos-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-card" style={{ height: '300px' }}></div>
          ))}
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
          <div className="bracket-toolbar" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1.5rem', 
            background: 'rgba(29, 32, 34, 0.4)', 
            padding: '1rem', 
            borderRadius: '12px', 
            border: '1px solid var(--border)' 
          }}>
            <div>
              <h3 style={{ fontFamily: 'Anybody', fontSize: '1rem', textTransform: 'uppercase', color: 'var(--text)' }}>
                Proyección de Eliminatorias
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '0.25rem' }}>
                {partidosSimulados 
                  ? "Mostrando proyección de cruces de 16vos de final calculada a partir del estado actual de los grupos." 
                  : "Se muestran las llaves actuales en la base de datos."}
              </p>
            </div>
            <div>
              {partidosSimulados ? (
                <button 
                  onClick={handleRestablecer} 
                  className="admin-btn secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>restart_alt</span>
                  Restablecer Real
                </button>
              ) : (
                <button 
                  onClick={handleSimular} 
                  className="admin-btn primary"
                  style={{ fontSize: '0.8rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>auto_awesome</span>
                  Simular 16vos
                </button>
              )}
            </div>
          </div>
          <Brackets partidos={partidosParaBrackets} />
        </div>
      )}
    </div>
  );
}
