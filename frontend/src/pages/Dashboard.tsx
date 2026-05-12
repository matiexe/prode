import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/useAuth';
import { listarPartidos } from '../api/partidos';
import { obtenerMisPronosticos, guardarPronostico } from '../api/pronosticos';
import PartidoCard from '../components/PartidoCard';
import type { Partido, Pronostico } from '../types';

export default function Dashboard() {
  const { usuario, logout } = useAuth();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [pronosticos, setPronosticos] = useState<Pronostico[]>([]);
  const [fase, setFase] = useState('grupos');
  const [grupo, setGrupo] = useState('');
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [version, setVersion] = useState(0);
  const pendingRef = useRef<Map<number, { local: string; visitante: string }>>(new Map());
  const [pendingCount, setPendingCount] = useState(0);
  const [savingAll, setSavingAll] = useState(false);

  const grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
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

  const fases = ['grupos', '16vos', '8vos', 'cuartos', 'semis', '3er_puesto', 'final'];

  const totalPuntos = pronosticos.reduce(
    (sum, p) => sum + (p.puntosObtenidos ?? 0), 0
  );

  const partidosPendientes = partidos.filter(
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
          <h1>Bienvenido, {usuario?.nombre}</h1>
          <p className="subtitle">Tus pronosticos del Mundial 2026</p>
        </div>
        <div className="puntos-resumen">
          <span className="puntos-total">{totalPuntos}</span>
          <span className="puntos-label">puntos</span>
        </div>
      </div>

      {mensaje && (
        <div className={`toast ${mensaje.tipo}`}>
          <span>{mensaje.tipo === 'success' ? '✓' : '✕'}</span> {mensaje.texto}
        </div>
      )}

      {faltanPronosticar > 0 && (
        <div className="missing-banner">
          <span className="material-symbols-outlined">how_to_reg</span>
          <span>
            Te faltan <strong>{faltanPronosticar}</strong> pronostico{faltanPronosticar !== 1 ? 's' : ''} por completar
            {grupo ? <> en el <strong>Grupo {grupo}</strong></> : <> en esta fase</>}
          </span>
        </div>
      )}

      {faltanPronosticar === 0 && partidosPendientes.length > 0 && (
        <div className="missing-banner done">
          <span className="material-symbols-outlined">check_circle</span>
          <span>
            Completaste todos los pronosticos{grupo ? <> del <strong>Grupo {grupo}</strong></> : <> de esta fase</>}
          </span>
        </div>
      )}

      <div className="fase-tabs">
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
      </div>

      {fase === 'grupos' && (
        <div className="grupo-filtro">
          <label>Filtrar por grupo: </label>
          <select value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            <option value="">Todos los grupos</option>
            {grupos.map((g) => (
              <option key={g} value={g}>Grupo {g}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="loading">Cargando partidos...</div>
      ) : partidos.length === 0 ? (
        <div className="empty">
          No hay partidos disponibles para esta fase. El administrador debe generar el fixture.
        </div>
      ) : (
        <>
          {pendingCount > 0 && (
            <div className="save-all-bar">
              <span>{pendingCount} pronostico{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}</span>
              <button className="btn-save-all" onClick={handleGuardarTodos} disabled={savingAll}>
                {savingAll ? 'Guardando...' : `Guardar Todos (${pendingCount})`}
              </button>
            </div>
          )}
          <div className="partidos-grid">
            {partidos.map((partido) => {
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

      <button onClick={logout} className="btn-logout">Cerrar sesion</button>
    </div>
  );
}
