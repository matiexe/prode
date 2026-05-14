import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/useAuth';
import { listarPartidos } from '../api/partidos';
import { obtenerMisPronosticos, guardarPronostico } from '../api/pronosticos';
import PartidoCard from '../components/PartidoCard';
import TablaGrupo from '../components/TablaGrupo';
import type { EquipoPosicion } from '../components/TablaGrupo';
import type { Partido, Pronostico } from '../types';

export default function Dashboard() {
  const { usuario, logout } = useAuth();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [pronosticos, setPronosticos] = useState<Pronostico[]>([]);
  const [fase, setFase] = useState('grupos');
  const [grupo, setGrupo] = useState('');
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);
  const timerRef = useRef<any>(null);
  const [version, setVersion] = useState(0);
  const pendingRef = useRef<Map<number, { local: string; visitante: string }>>(new Map());
  const [pendingCount, setPendingCount] = useState(0);
  const [savingAll, setSavingAll] = useState(false);

  const grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!usuario) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [partidosData, pronosticosData] = await Promise.all([
          listarPartidos(fase, grupo || undefined),
          obtenerMisPronosticos(),
        ]);
        setPartidos(partidosData);
        setPronosticos(pronosticosData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fase, grupo, usuario]);

  const getPronostico = (partidoId: number) => {
    const p = pronosticos.find((pr) => pr.partidoId === partidoId);
    return p ? { local: p.golesLocal, visitante: p.golesVisitante, puntos: p.puntosObtenidos } : undefined;
  };

  const handleInputChange = (partidoId: number, local: string, visitante: string) => {
    const saved = getPronostico(partidoId);
    const hasValue = local !== '' && visitante !== '';
    const isDirty = hasValue && (local !== saved?.local?.toString() || visitante !== saved?.visitante?.toString());

    if (isDirty) {
      pendingRef.current.set(partidoId, { local, visitante });
    } else {
      pendingRef.current.delete(partidoId);
    }
    setPendingCount(pendingRef.current.size);
    // Forzamos re-render para el simulador
    setVersion(v => v + 1);
  };

  const handleGuardar = async (partidoId: number, golesLocal: number, golesVisitante: number) => {
    try {
      await guardarPronostico(partidoId, golesLocal, golesVisitante);
      const pronosticosData = await obtenerMisPronosticos();
      setPronosticos(pronosticosData);
      setMensaje({ texto: 'Pronostico guardado correctamente', tipo: 'success' });
      pendingRef.current.delete(partidoId);
      setPendingCount(pendingRef.current.size);
      setVersion((v) => v + 1);
    } catch {
      setMensaje({ texto: 'Error al guardar el pronostico', tipo: 'error' });
    }
    clearTimeout(timerRef.current as any);
    timerRef.current = setTimeout(() => setMensaje(null), 3000) as any;
  };

  const handleGuardarTodos = async () => {
    const entries = [...pendingRef.current.entries()];
    if (entries.length === 0) return;

    setSavingAll(true);
    let ok = 0;
    let err = 0;

    for (const [partidoId, { local, visitante }] of entries) {
      try {
        await guardarPronostico(partidoId, parseInt(local, 10), parseInt(visitante, 10));
        ok++;
      } catch {
        err++;
      }
    }

    const pronosticosData = await obtenerMisPronosticos();
    setPronosticos(pronosticosData);
    pendingRef.current.clear();
    setPendingCount(0);
    setVersion((v) => v + 1);
    setSavingAll(false);

    setMensaje({
      texto: err === 0
        ? `Todos los pronosticos guardados (${ok})`
        : `Guardados: ${ok}, errores: ${err}`,
      tipo: err === 0 ? 'success' : 'error',
    });
    clearTimeout(timerRef.current as any);
    timerRef.current = setTimeout(() => setMensaje(null), 4000) as any;
  };

  // Lógica del simulador
  const tablaProyectada = useMemo(() => {
    if (fase !== 'grupos' || !grupo) return null;

    const tabla: Record<string, EquipoPosicion> = {};
    const initEquipo = (nombre: string) => {
      if (!tabla[nombre]) {
        tabla[nombre] = { equipo: nombre, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
      }
    };

    partidos.forEach(p => {
      initEquipo(p.equipoLocal);
      initEquipo(p.equipoVisitante);

      let gL: number | null = null;
      let gV: number | null = null;

      if (p.estado === 'finalizado') {
        gL = p.golesLocal;
        gV = p.golesVisitante;
      } else {
        const pending = pendingRef.current.get(p.id);
        if (pending) {
          gL = parseInt(pending.local, 10);
          gV = parseInt(pending.visitante, 10);
        } else {
          const saved = getPronostico(p.id);
          if (saved) {
            gL = saved.local;
            gV = saved.visitante;
          }
        }
      }

      if (gL !== null && gV !== null && !isNaN(gL) && !isNaN(gV)) {
        const local = tabla[p.equipoLocal];
        const visit = tabla[p.equipoVisitante];

        local.pj++;
        visit.pj++;
        local.gf += gL;
        local.gc += gV;
        visit.gf += gV;
        visit.gc += gL;

        if (gL > gV) {
          local.pg++;
          local.pts += 3;
          visit.pp++;
        } else if (gL < gV) {
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
    });

    return Object.values(tabla).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      return b.gf - a.gf;
    });
  }, [partidos, pronosticos, grupo, fase, version]);

  const fases = ['grupos', '16vos', '8vos', 'cuartos', 'semis', '3er_puesto', 'final'];

  const totalPuntos = pronosticos.reduce(
    (sum, p) => sum + (p.puntosObtenidos ?? 0), 0
  );

  // Filtros de visualización
  const partidosAMostrar = partidos.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  
  const partidosPendientes = partidosAMostrar.filter(
    (p) => p.estado === 'pendiente' && new Date(p.fechaHora) > new Date()
  );

  const partidosPronosticados = partidosPendientes.filter(
    (p) => pronosticos.some((pr) => pr.partidoId === p.id)
  );

  const faltanPronosticar = partidosPendientes.length - partidosPronosticados.length;

  return (
    <div className="page dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Hola, {usuario?.nombre}</h1>
          <p className="subtitle">Gestiona tus pronósticos y sigue los resultados en vivo.</p>
        </div>
        <div className="puntos-resumen">
          <span className="puntos-total">{totalPuntos}</span>
          <span className="puntos-label">puntos totales</span>
        </div>
      </div>

      {mensaje && (
        <div className={`toast ${mensaje.tipo}`}>
          <span>{mensaje.tipo === 'success' ? '✓' : '✕'}</span> {mensaje.texto}
        </div>
      )}

      {faltanPronosticar > 0 && (
        <div className="missing-banner">
          <div className="hero-badge-dot" style={{ marginRight: '0.5rem' }}>
            <span className="ping"></span>
            <span className="static"></span>
          </div>
          <span>
            Tienes <strong>{faltanPronosticar}</strong> pronóstico{faltanPronosticar !== 1 ? 's' : ''} pendiente{faltanPronosticar !== 1 ? 's' : ''} por completar.
          </span>
        </div>
      )}

      {faltanPronosticar === 0 && partidosPendientes.length > 0 && (
        <div className="missing-banner done">
          <span className="material-symbols-outlined">verified</span>
          <span>¡Todo listo! Has completado todos los pronósticos disponibles.</span>
        </div>
      )}

      <nav className="fase-tabs">
        {fases.map((f) => (
          <button
            key={f}
            className={`fase-tab ${fase === f ? 'active' : ''}`}
            onClick={() => { setFase(f); setGrupo(''); }}
          >
            {f === 'grupos' ? 'Fase de Grupos' :
             f === '16vos' ? '16vos' :
             f === '8vos' ? '8vos' :
             f === 'cuartos' ? 'Cuartos' :
             f === 'semis' ? 'Semis' :
             f === '3er_puesto' ? '3er Puesto' : 'Final'}
          </button>
        ))}
      </nav>

      <div className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: fase === 'grupos' && grupo ? '1fr 320px' : '1fr', gap: '2rem' }}>
        <div className="dashboard-left">
          {fase === 'grupos' && (
            <div className="grupo-filtro glass-card" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', width: 'fit-content' }}>
              <label style={{ fontFamily: 'Anybody', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--outline)' }}>Filtrar por grupo: </label>
              <select value={grupo} onChange={(e) => setGrupo(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                <option value="" style={{ background: 'var(--surface-container-high)' }}>Todos los grupos</option>
                {grupos.map((g) => (
                  <option key={g} value={g} style={{ background: 'var(--surface-container-high)' }}>Grupo {g}</option>
                ))}
              </select>
            </div>
          )}

          {loading ? (
            <div className="loading">Cargando partidos...</div>
          ) : partidosAMostrar.length === 0 ? (
            <div className="empty glass-card" style={{ borderRadius: '16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>event_busy</span>
              <p>No se encontraron partidos para esta selección.</p>
              <small style={{ opacity: 0.5 }}>El administrador debe generar el fixture para la fase {fase}.</small>
            </div>
          ) : (
            <>
              {pendingCount > 0 && (
                <div className="save-all-bar glass-card" style={{ borderRadius: '12px', borderLeft: '4px solid var(--tertiary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>edit_notifications</span>
                    <span>{pendingCount} pronóstico{pendingCount !== 1 ? 's' : ''} sin guardar</span>
                  </div>
                  <button className="btn-save-all" onClick={handleGuardarTodos} disabled={savingAll}>
                    {savingAll ? 'Guardando...' : `Guardar Todo`}
                  </button>
                </div>
              )}
              <div className="partidos-grid">
                {partidosAMostrar.map((partido) => {
                  const miProno = getPronostico(partido.id);
                  return (
                    <PartidoCard
                      key={`${partido.id}-${version}`}
                      partido={partido}
                      golesLocal={miProno?.local}
                      golesVisitante={miProno?.visitante}
                      puntosObtenidos={miProno?.puntos}
                      onGuardar={(local, visitante) => handleGuardar(partido.id, local, visitante)}
                      onInputChange={handleInputChange}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>

        {fase === 'grupos' && grupo && tablaProyectada && (
          <aside className="dashboard-right">
            <header style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>analytics</span>
              <h2 style={{ fontSize: '0.8rem', fontFamily: 'Anybody', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Simulador de Posiciones
              </h2>
            </header>
            <div className="glass-card" style={{ borderRadius: '16px', padding: '1rem' }}>
              <TablaGrupo titulo={`Grupo ${grupo} (Proyectado)`} posiciones={tablaProyectada} />
              <p style={{ fontSize: '0.65rem', color: 'var(--outline)', fontStyle: 'italic', marginTop: '1rem', lineHeight: '1.4' }}>
                * Esta tabla se actualiza en tiempo real mientras escribes tus pronósticos.
              </p>
            </div>
          </aside>
        )}
      </div>

      <footer style={{ marginTop: '4rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
        <button onClick={logout} className="admin-btn danger" style={{ width: 'auto' }}>
          <span className="material-symbols-outlined">logout</span>
          Cerrar sesión
        </button>
      </footer>
    </div>
  );
}
