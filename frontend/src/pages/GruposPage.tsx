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
    return b.gf - a.gf;
  });
}

// Función para simular recursivamente el torneo desde 16vos hasta la final
function simularTorneoCompleto(partidosBase: Partido[]): Partido[] {
  const partidosSim = partidosBase.map(p => ({ ...p }));

  const grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];
  const primeros: Record<string, string> = {};
  const segundos: Record<string, string> = {};
  const terceros: EquipoPosicion[] = [];

  for (const g of grupos) {
    const tabla = calcularTablaConPartidos(partidosSim, g);
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

  const llaves16vos = [
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
    { local: primeros['L'], visite: segundos['G'] }, // P86
    { local: segundos['G'], visite: segundos['I'] }, // P87
    { local: segundos['E'], visite: segundos['H'] }, // P88
  ];

  const partidos16vos = partidosSim.filter(p => p.fase === '16vos').sort((a, b) => a.id - b.id);
  partidos16vos.forEach((p, idx) => {
    if (llaves16vos[idx]) {
      p.equipoLocal = llaves16vos[idx].local || 'Por definir';
      p.equipoVisitante = llaves16vos[idx].visite || 'Por definir';
    }
  });

  const simularPartidoResultado = (local: string, visitante: string) => {
    if (local === 'Por definir' || visitante === 'Por definir') {
      return { golesLocal: null, golesVisitante: null, ganador: null };
    }
    const gl = Math.floor(Math.random() * 4);
    const gv = Math.floor(Math.random() * 4);
    let ganador = '';
    if (gl > gv) {
      ganador = local;
    } else if (gv > gl) {
      ganador = visitante;
    } else {
      ganador = Math.random() > 0.5 ? local : visitante;
    }
    return { golesLocal: gl, golesVisitante: gv, ganador };
  };

  const ganadores16vos: string[] = [];
  partidos16vos.forEach(p => {
    if (p.estado === 'finalizado') {
      ganadores16vos.push(p.ganadorNombre || '');
    } else {
      const sim = simularPartidoResultado(p.equipoLocal, p.equipoVisitante);
      p.golesLocal = sim.golesLocal;
      p.golesVisitante = sim.golesVisitante;
      p.ganadorNombre = sim.ganador;
      p.estado = 'finalizado';
      ganadores16vos.push(sim.ganador || '');
    }
  });

  const partidos8vos = partidosSim.filter(p => p.fase === '8vos').sort((a, b) => a.id - b.id);
  const ganadores8vos: string[] = [];
  partidos8vos.forEach((p, idx) => {
    p.equipoLocal = ganadores16vos[idx * 2] || 'Por definir';
    p.equipoVisitante = ganadores16vos[idx * 2 + 1] || 'Por definir';

    if (p.estado === 'finalizado') {
      ganadores8vos.push(p.ganadorNombre || '');
    } else {
      const sim = simularPartidoResultado(p.equipoLocal, p.equipoVisitante);
      p.golesLocal = sim.golesLocal;
      p.golesVisitante = sim.golesVisitante;
      p.ganadorNombre = sim.ganador;
      p.estado = 'finalizado';
      ganadores8vos.push(sim.ganador || '');
    }
  });

  const partidosCuartos = partidosSim.filter(p => p.fase === 'cuartos').sort((a, b) => a.id - b.id);
  const ganadoresCuartos: string[] = [];
  partidosCuartos.forEach((p, idx) => {
    p.equipoLocal = ganadores8vos[idx * 2] || 'Por definir';
    p.equipoVisitante = ganadores8vos[idx * 2 + 1] || 'Por definir';

    if (p.estado === 'finalizado') {
      ganadoresCuartos.push(p.ganadorNombre || '');
    } else {
      const sim = simularPartidoResultado(p.equipoLocal, p.equipoVisitante);
      p.golesLocal = sim.golesLocal;
      p.golesVisitante = sim.golesVisitante;
      p.ganadorNombre = sim.ganador;
      p.estado = 'finalizado';
      ganadoresCuartos.push(sim.ganador || '');
    }
  });

  const partidosSemis = partidosSim.filter(p => p.fase === 'semis').sort((a, b) => a.id - b.id);
  const ganadoresSemis: string[] = [];
  const perdedoresSemis: string[] = [];
  partidosSemis.forEach((p, idx) => {
    p.equipoLocal = ganadoresCuartos[idx * 2] || 'Por definir';
    p.equipoVisitante = ganadoresCuartos[idx * 2 + 1] || 'Por definir';

    if (p.estado === 'finalizado') {
      ganadoresSemis.push(p.ganadorNombre || '');
      perdedoresSemis.push(p.ganadorNombre === p.equipoLocal ? p.equipoVisitante : p.equipoLocal);
    } else {
      const sim = simularPartidoResultado(p.equipoLocal, p.equipoVisitante);
      p.golesLocal = sim.golesLocal;
      p.golesVisitante = sim.golesVisitante;
      p.ganadorNombre = sim.ganador;
      p.estado = 'finalizado';
      ganadoresSemis.push(sim.ganador || '');
      perdedoresSemis.push(sim.ganador === p.equipoLocal ? p.equipoVisitante : p.equipoLocal);
    }
  });

  const partido3erPuesto = partidosSim.find(p => p.fase === '3er_puesto');
  if (partido3erPuesto) {
    partido3erPuesto.equipoLocal = perdedoresSemis[0] || 'Por definir';
    partido3erPuesto.equipoVisitante = perdedoresSemis[1] || 'Por definir';
    if (partido3erPuesto.estado !== 'finalizado') {
      const sim = simularPartidoResultado(partido3erPuesto.equipoLocal, partido3erPuesto.equipoVisitante);
      partido3erPuesto.golesLocal = sim.golesLocal;
      partido3erPuesto.golesVisitante = sim.golesVisitante;
      partido3erPuesto.ganadorNombre = sim.ganador;
      partido3erPuesto.estado = 'finalizado';
    }
  }

  const partidoFinal = partidosSim.find(p => p.fase === 'final');
  if (partidoFinal) {
    partidoFinal.equipoLocal = ganadoresSemis[0] || 'Por definir';
    partidoFinal.equipoVisitante = ganadoresSemis[1] || 'Por definir';
    if (partidoFinal.estado !== 'finalizado') {
      const sim = simularPartidoResultado(partidoFinal.equipoLocal, partidoFinal.equipoVisitante);
      partidoFinal.golesLocal = sim.golesLocal;
      partidoFinal.golesVisitante = sim.golesVisitante;
      partidoFinal.ganadorNombre = sim.ganador;
      partidoFinal.estado = 'finalizado';
    }
  }

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
    const sim = simularTorneoCompleto(partidos);
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
                  ? "Mostrando simulación de llaves basada en los resultados actuales de grupos." 
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
                  Simular Restante
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
