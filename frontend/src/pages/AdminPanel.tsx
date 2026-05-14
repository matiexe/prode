import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import { listarUsuarios, crearUsuario, desactivarUsuario } from '../api/usuarios';
import { listarPartidos, generarFixture, eliminarFixture, cargarResultado, cerrarFase } from '../api/partidos';
import { obtenerConfiguracion, actualizarConfiguracion } from '../api/configuracion';
import { obtenerAdminStats, AdminStats } from '../api/admin';
import { getFlagUrl } from '../utils/flags';
import FormUsuario from '../components/FormUsuario';
import ModalResultado from '../components/ModalResultado';
import type { Usuario, Partido, ConfiguracionPuntos } from '../types';

type Tab = 'dashboard' | 'usuarios' | 'cargar' | 'finalizados' | 'configuracion';

export default function AdminPanel() {
  const { usuario, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [partidoModal, setPartidoModal] = useState<Partido | null>(null);
  const [faseFiltro, setFaseFiltro] = useState('grupos');
  const [grupoFiltro, setGrupoFiltro] = useState('');

  const [configPuntos, setConfigPuntos] = useState<ConfiguracionPuntos | null>(null);

  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [cerrandoFase, setCerrandoFase] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    setSidebarOpen(false); // Close sidebar on tab change (mobile)
    
    if (tab === 'dashboard') fetchStats();
    else if (tab === 'usuarios') fetchUsuarios();
    else if (tab === 'cargar' || tab === 'finalizados') fetchPartidos();
    else if (tab === 'configuracion') fetchConfig();
  }, [tab, usuario]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await obtenerAdminStats();
      setStats(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchPartidos = async (fase?: string, grupo?: string) => {
    setLoading(true);
    try {
      const data = await listarPartidos(fase || faseFiltro, grupo || grupoFiltro || undefined);
      setPartidos(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await obtenerConfiguracion();
      setConfigPuntos(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCerrarFase = async () => {
    const label = faseFiltro === 'grupos' ? 'Fase de Grupos' : faseFiltro;
    if (!window.confirm(`¿Estás seguro de cerrar la ${label}? Esto avanzará automáticamente a los ganadores a la siguiente fase.`)) return;
    
    setCerrandoFase(true);
    setMensaje('');
    try {
      const res = await cerrarFase(faseFiltro);
      setMensaje(res.mensaje);
      if (tab === 'cargar') fetchPartidos();
    } catch (err: any) {
      setMensaje(err.response?.data?.error || 'Error al cerrar fase');
    } finally {
      setCerrandoFase(false);
    }
  };


  const handleCrearUsuario = async (nombre: string, email: string, rol: string) => {
    await crearUsuario(nombre, email, rol);
    setMostrarForm(false);
    fetchUsuarios();
    setMensaje('Usuario creado correctamente');
  };

  const handleDesactivar = async (id: number) => {
    await desactivarUsuario(id);
    fetchUsuarios();
  };

  const handleEliminarFixture = async () => {
    if (!window.confirm('¿Eliminar todo el fixture? Tambien se borraran todos los pronosticos.')) return;
    setEliminando(true);
    try {
      const res = await eliminarFixture();
      setMensaje(res.mensaje);
      fetchPartidos();
    } catch (err: any) {
      setMensaje(err.response?.data?.error || 'Error al eliminar fixture');
    } finally {
      setEliminando(false);
    }
  };

  const handleGenerarFixture = async () => {
    setGenerando(true);
    try {
      const res = await generarFixture();
      setMensaje(`Fixture generado: ${res.totalPartidos} partidos`);
      fetchPartidos();
    } catch (err: any) {
      setMensaje(err.response?.data?.error || 'Error al generar fixture');
    } finally {
      setGenerando(false);
    }
  };

  const handleCargarResultado = async (id: number, local: number, visitante: number, ganadorNombre?: string) => {
    await cargarResultado(id, local, visitante, ganadorNombre);
    fetchPartidos();
  };

  const handleActualizarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configPuntos) return;
    try {
      const nueva = await actualizarConfiguracion(configPuntos);
      setConfigPuntos(nueva);
      setMensaje('Configuracion actualizada');
    } catch (err) {
      console.error(err);
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'usuarios', label: 'Usuarios', icon: 'group' },
    { id: 'cargar', label: 'Cargar Resultados', icon: 'edit_square' },
    { id: 'finalizados', label: 'Finalizados', icon: 'sports_soccer' },
    { id: 'configuracion', label: 'Configuración', icon: 'settings' },
  ];

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', background: 'var(--surface-container-lowest)' }}>
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zindex: 90, backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ 
        width: '280px', 
        background: 'var(--surface-container-low)', 
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: sidebarOpen ? 'fixed' : 'sticky',
        top: '80px',
        height: 'calc(100vh - 80px)',
        zIndex: 100,
        transition: 'transform 0.3s ease',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        flexShrink: 0
      }}>
        <div className="sidebar-header" style={{ padding: '2rem 1.5rem' }}>
          <h2 style={{ fontFamily: 'Anybody', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--outline)' }}>
            Menú de Administración
          </h2>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, padding: '0 1rem' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`sidebar-item ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.5rem',
                border: 'none',
                background: tab === t.id ? 'rgba(177, 198, 249, 0.1)' : 'transparent',
                color: tab === t.id ? 'var(--primary)' : 'var(--on-surface-variant)',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'Anybody',
                fontSize: '0.85rem',
                fontWeight: tab === t.id ? 700 : 500,
                textAlign: 'left',
                marginBottom: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ padding: '2rem 1rem' }}>
          <button 
            onClick={logout} 
            className="admin-btn danger" 
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main" style={{ flex: 1, padding: '2rem clamp(16px, 5vw, 64px)', overflowX: 'hidden' }}>
        <button 
          className="sidebar-toggle" 
          onClick={() => setSidebarOpen(true)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            background: 'var(--surface-container-high)', 
            border: '1px solid var(--border)', 
            padding: '0.5rem 1rem', 
            borderRadius: '8px',
            color: 'var(--on-surface)',
            cursor: 'pointer',
            marginBottom: '1.5rem'
          }}
        >
          <span className="material-symbols-outlined">menu</span>
          Menú
        </button>

        {mensaje && (
          <div className="success-message" style={{ marginBottom: '2rem' }}>
            <span>{mensaje}</span>
            <button onClick={() => setMensaje('')}>✕</button>
          </div>
        )}

        {tab === 'dashboard' && (
          <section className="admin-section">
            <header className="admin-header" style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '1.5rem', marginBottom: '2.5rem' }}>
              <h1>Dashboard Admin</h1>
              <p className="subtitle">Resumen general del estado del sistema y participación.</p>
            </header>

            {loading ? (
              <div className="admin-config-grid">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="skeleton-card" style={{ height: '120px' }}></div>
                ))}
              </div>
            ) : stats && (
              <div className="admin-config-grid">
                <div className="config-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <label>Usuarios Totales</label>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'Anybody' }}>
                    {stats.totalUsuarios}
                  </div>
                  <p className="hint">Total registrados en el sistema.</p>
                </div>
                <div className="config-card" style={{ borderLeft: '4px solid var(--tertiary)' }}>
                  <label>Usuarios Activos</label>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--tertiary)', fontFamily: 'Anybody' }}>
                    {stats.usuariosActivos}
                  </div>
                  <p className="hint">Usuarios con cuenta habilitada.</p>
                </div>
                <div className="config-card" style={{ borderLeft: '4px solid #00F0FF' }}>
                  <label>Pronósticos</label>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#00F0FF', fontFamily: 'Anybody' }}>
                    {stats.totalPronosticos}
                  </div>
                  <p className="hint">Total de predicciones cargadas.</p>
                </div>
                <div className="config-card" style={{ borderLeft: '4px solid var(--primary-fixed)' }}>
                  <label>Partidos</label>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-fixed)', fontFamily: 'Anybody' }}>
                    {stats.partidosFinalizados} / {stats.totalPartidos}
                  </div>
                  <p className="hint">Finalizados vs Total del torneo.</p>
                </div>
              </div>
            )}

            <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', marginTop: '2rem' }}>
              <h3 style={{ fontFamily: 'Anybody', marginBottom: '1rem', textTransform: 'uppercase' }}>Acciones Rápidas</h3>
              <div className="admin-actions">
                <button className="admin-btn primary" onClick={() => setTab('cargar')}>Cargar Resultados</button>
                <button className="admin-btn secondary" onClick={() => setTab('usuarios')}>Gestionar Usuarios</button>
              </div>
            </div>
          </section>
        )}

        {tab === 'usuarios' && (
          <section className="admin-section">
            <header className="section-header">
              <div>
                <h2>Gestión de Usuarios</h2>
                <p className="subtitle" style={{ fontSize: '0.85rem' }}>Lista de participantes y administradores.</p>
              </div>
              <button className="admin-btn primary" onClick={() => setMostrarForm(true)}>
                <span className="material-symbols-outlined">person_add</span>
                Nuevo usuario
              </button>
            </header>

            {mostrarForm && (
              <div className="form-usuario glass-card" style={{ marginBottom: '2rem' }}>
                <FormUsuario
                  onSubmit={handleCrearUsuario}
                  onCancel={() => setMostrarForm(false)}
                />
              </div>
            )}

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{u.nombre}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="fase-tag">{u.rol}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${u.activo ? 'active' : 'inactive'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {u.activo && u.id !== usuario?.id && (
                          <button className="admin-btn danger" onClick={() => handleDesactivar(u.id)}>
                            Desactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'cargar' && (
          <section className="admin-section">
            <header className="section-header">
              <div>
                <h2>Cargar Resultados</h2>
                <p className="subtitle" style={{ fontSize: '0.85rem' }}>Ingresa los marcadores reales para calcular puntos.</p>
              </div>
              <div className="admin-actions">
                <button className="admin-btn primary" onClick={handleGenerarFixture} disabled={generando}>
                  {generando ? 'Generando...' : 'Generar fixture'}
                </button>
                {faseFiltro !== 'final' && faseFiltro !== '3er_puesto' && (
                  <button 
                    className="admin-btn secondary" 
                    onClick={handleCerrarFase} 
                    disabled={cerrandoFase}
                  >
                    🏆 Cerrar {faseFiltro === 'grupos' ? 'fase de grupos' : faseFiltro}
                  </button>
                )}
                <button className="admin-btn danger" onClick={handleEliminarFixture} disabled={eliminando}>
                  Borrar fixture
                </button>
              </div>
            </header>

            <nav className="fase-tabs" style={{ marginBottom: '2rem' }}>
              {['grupos', '16vos', '8vos', 'cuartos', 'semis', '3er_puesto', 'final'].map((f) => (
                <button
                  key={f}
                  className={`fase-tab ${faseFiltro === f ? 'active' : ''}`}
                  onClick={() => { setFaseFiltro(f); setGrupoFiltro(''); fetchPartidos(f, ''); }}
                >
                  {f === 'grupos' ? 'Grupos' : f}
                </button>
              ))}
            </nav>

            {faseFiltro === 'grupos' && (
              <div className="grupo-filtro glass-card" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', marginBottom: '2rem', width: 'fit-content' }}>
                <label style={{ fontFamily: 'Anybody', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--outline)' }}>Filtrar por grupo: </label>
                <select
                  value={grupoFiltro}
                  onChange={(e) => { setGrupoFiltro(e.target.value); fetchPartidos('grupos', e.target.value); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  <option value="" style={{ background: 'var(--surface-container-high)' }}>Todos los grupos</option>
                  {['A','B','C','D','E','F','G','H','I','J','K','L'].map((g) => (
                    <option key={g} value={g} style={{ background: 'var(--surface-container-high)' }}>Grupo {g}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="admin-matches-grid">
              {partidos.filter((p) => p.estado !== 'finalizado').map((p) => (
                <article key={p.id} className="admin-match-card">
                  <div className="match-meta">
                    <span className="fase-tag">{p.fase}</span>
                    {p.grupo && <span className="grupo-tag">Grupo {p.grupo}</span>}
                  </div>
                  <div className="team-row">
                    <div className="team-info">
                      {getFlagUrl(p.equipoLocal) && <img className="flag-icon" src={getFlagUrl(p.equipoLocal)} alt="" />}
                      {p.equipoLocal}
                    </div>
                    <span className="vs">vs</span>
                    <div className="team-info">
                      {p.equipoVisitante}
                      {getFlagUrl(p.equipoVisitante) && <img className="flag-icon" src={getFlagUrl(p.equipoVisitante)} alt="" />}
                    </div>
                  </div>
                  <button 
                    className="admin-btn primary" 
                    style={{ width: '100%', marginTop: '1.5rem' }}
                    onClick={() => setPartidoModal(p)}
                  >
                    Cargar Resultado
                  </button>
                </article>
              ))}
            </div>

            {partidoModal && (
              <ModalResultado
                partido={partidoModal}
                onGuardar={handleCargarResultado}
                onClose={() => setPartidoModal(null)}
              />
            )}
          </section>
        )}

        {tab === 'finalizados' && (
          <section className="admin-section">
            <header className="section-header">
              <div>
                <h2>Resultados Cargados</h2>
                <p className="subtitle" style={{ fontSize: '0.85rem' }}>Historial de partidos jugados.</p>
              </div>
            </header>

            <nav className="fase-tabs" style={{ marginBottom: '2rem' }}>
              {['grupos', '16vos', '8vos', 'cuartos', 'semis', '3er_puesto', 'final'].map((f) => (
                <button
                  key={f}
                  className={`fase-tab ${faseFiltro === f ? 'active' : ''}`}
                  onClick={() => { setFaseFiltro(f); setGrupoFiltro(''); fetchPartidos(f, ''); }}
                >
                  {f === 'grupos' ? 'Grupos' : f}
                </button>
              ))}
            </nav>

            <div className="admin-matches-grid">
              {partidos.filter((p) => p.estado === 'finalizado').map((p) => (
                <article key={p.id} className="admin-match-card finalizado">
                  <div className="match-meta">
                    <span className="fase-tag">{p.fase}</span>
                    <span className="fecha">{new Date(p.fechaHora).toLocaleDateString()}</span>
                  </div>
                  <div className="team-row">
                    <div className="team-info">
                      {getFlagUrl(p.equipoLocal) && <img className="flag-icon" src={getFlagUrl(p.equipoLocal)} alt="" />}
                      {p.equipoLocal}
                    </div>
                    <div className="score-display">
                      {p.golesLocal} - {p.golesVisitante}
                    </div>
                    <div className="team-info">
                      {p.equipoVisitante}
                      {getFlagUrl(p.equipoVisitante) && <img className="flag-icon" src={getFlagUrl(p.equipoVisitante)} alt="" />}
                    </div>
                  </div>
                  {p.ganadorNombre && (
                    <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--tertiary)', fontFamily: 'Anybody', fontWeight: 700, textTransform: 'uppercase' }}>
                      Ganador: {p.ganadorNombre}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'configuracion' && configPuntos && (
          <section className="admin-section">
            <header className="section-header">
              <div>
                <h2>Sistema de Puntuación</h2>
                <p className="subtitle" style={{ fontSize: '0.85rem' }}>Define los puntos que los usuarios ganan por sus pronósticos.</p>
              </div>
            </header>
            
            <form onSubmit={handleActualizarConfig}>
              <div className="admin-config-grid">
                <div className="config-card">
                  <label>Resultado Exacto</label>
                  <input 
                    type="number" 
                    value={configPuntos.exacto} 
                    onChange={(e) => setConfigPuntos({ ...configPuntos, exacto: parseInt(e.target.value, 10) || 0 })} 
                  />
                  <p className="hint">Puntos por acertar el marcador exacto.</p>
                </div>
                <div className="config-card">
                  <label>Diferencia de Goles</label>
                  <input 
                    type="number" 
                    value={configPuntos.diferencia} 
                    onChange={(e) => setConfigPuntos({ ...configPuntos, diferencia: parseInt(e.target.value, 10) || 0 })} 
                  />
                  <p className="hint">Acertar ganador y diferencia (ej: pusiste 2-0 y fue 3-1).</p>
                </div>
                <div className="config-card">
                  <label>Solo Ganador</label>
                  <input 
                    type="number" 
                    value={configPuntos.ganador} 
                    onChange={(e) => setConfigPuntos({ ...configPuntos, ganador: parseInt(e.target.value, 10) || 0 })} 
                  />
                  <p className="hint">Puntos por acertar solo quién gana o si hay empate.</p>
                </div>
                <div className="config-card">
                  <label>Error</label>
                  <input 
                    type="number" 
                    value={configPuntos.error} 
                    onChange={(e) => setConfigPuntos({ ...configPuntos, error: parseInt(e.target.value, 10) || 0 })} 
                  />
                  <p className="hint">Puntos por pronóstico totalmente fallido.</p>
                </div>
              </div>
              <button type="submit" className="admin-btn primary" style={{ padding: '1rem 3rem' }}>
                Guardar Configuración
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
