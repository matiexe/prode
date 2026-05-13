import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import { listarUsuarios, crearUsuario, desactivarUsuario } from '../api/usuarios';
import { listarPartidos, generarFixture, eliminarFixture, cargarResultado, cerrarFase } from '../api/partidos';
import { obtenerConfiguracion, actualizarConfiguracion } from '../api/configuracion';
import { getFlagUrl, getFlagSrcset } from '../utils/flags';
import FormUsuario from '../components/FormUsuario';
import ModalResultado from '../components/ModalResultado';
import type { Usuario, Partido, ConfiguracionPuntos } from '../types';

type Tab = 'usuarios' | 'cargar' | 'finalizados' | 'configuracion';

export default function AdminPanel() {
  const { usuario, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('usuarios');

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [partidoModal, setPartidoModal] = useState<Partido | null>(null);
  const [faseFiltro, setFaseFiltro] = useState('grupos');
  const [grupoFiltro, setGrupoFiltro] = useState('');

  const [configPuntos, setConfigPuntos] = useState<ConfiguracionPuntos | null>(null);

  const [mensaje, setMensaje] = useState('');
  const [generando, setGenerando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [cerrandoFase, setCerrandoFase] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    if (tab === 'usuarios') fetchUsuarios();
    else if (tab === 'cargar' || tab === 'finalizados') fetchPartidos();
    else if (tab === 'configuracion') fetchConfig();
  }, [tab, usuario]);

  const fetchUsuarios = async () => {
    try {
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (err) { console.error(err); }
  };

  const fetchPartidos = async (fase?: string, grupo?: string) => {
    try {
      const data = await listarPartidos(fase || faseFiltro, grupo || grupoFiltro || undefined);
      setPartidos(data);
    } catch (err) { console.error(err); }
  };

  const fetchConfig = async () => {
    try {
      const data = await obtenerConfiguracion();
      setConfigPuntos(data);
    } catch (err) { console.error(err); }
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

  return (
    <div className="page admin-panel">
      <header className="admin-header">
        <h1>Panel de Administración</h1>
        <p className="subtitle">Bienvenido, {usuario?.nombre}. Gestiona usuarios, resultados y configuraciones del Mundial.</p>
      </header>

      {mensaje && (
        <div className="success-message">
          <span>{mensaje}</span>
          <button onClick={() => setMensaje('')}>✕</button>
        </div>
      )}

      <nav className="admin-tabs">
        {(['usuarios', 'cargar', 'finalizados', 'configuracion'] as Tab[]).map((t) => (
          <button 
            key={t} 
            className={`admin-tab ${tab === t ? 'active' : ''}`} 
            onClick={() => setTab(t)}
          >
            {t === 'usuarios' ? 'Usuarios' :
             t === 'cargar' ? 'Cargar Resultados' :
             t === 'finalizados' ? 'Finalizados' : 'Configuración'}
          </button>
        ))}
      </nav>

      {tab === 'usuarios' && (
        <section className="admin-section">
          <header className="section-header">
            <h2>Gestión de Usuarios</h2>
            <button className="admin-btn primary" onClick={() => setMostrarForm(true)}>
              <span className="material-symbols-outlined">person_add</span>
              Nuevo usuario
            </button>
          </header>

          {mostrarForm && (
            <div className="form-usuario glass-card">
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
            <h2>Cargar Resultados</h2>
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

          <nav className="fase-tabs">
            {['grupos', '16vos', '8vos', 'cuartos', 'semis', '3er_puesto', 'final'].map((f) => (
              <button
                key={f}
                className={`fase-tab ${faseFiltro === f ? 'active' : ''}`}
                onClick={() => { setFaseFiltro(f); setGrupoFiltro(''); fetchPartidos(f, ''); }}
              >
                {f === 'grupos' ? 'Fase de Grupos' : f}
              </button>
            ))}
          </nav>

          {faseFiltro === 'grupos' && (
            <div className="grupo-filtro glass-card" style={{ padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
              <label>Filtrar por grupo: </label>
              <select
                value={grupoFiltro}
                onChange={(e) => { setGrupoFiltro(e.target.value); fetchPartidos('grupos', e.target.value); }}
              >
                <option value="">Todos los grupos</option>
                {['A','B','C','D','E','F','G','H','I','J','K','L'].map((g) => (
                  <option key={g} value={g}>Grupo {g}</option>
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
                  style={{ width: '100%', marginTop: '1rem' }}
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
            <h2>Resultados Cargados</h2>
          </header>

          <nav className="fase-tabs">
            {['grupos', '16vos', '8vos', 'cuartos', 'semis', '3er_puesto', 'final'].map((f) => (
              <button
                key={f}
                className={`fase-tab ${faseFiltro === f ? 'active' : ''}`}
                onClick={() => { setFaseFiltro(f); setGrupoFiltro(''); fetchPartidos(f, ''); }}
              >
                {f === 'grupos' ? 'Fase de Grupos' : f}
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
                  <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--tertiary)' }}>
                    Ganador: <strong>{p.ganadorNombre}</strong>
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
            <h2>Sistema de Puntuación</h2>
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

      <footer style={{ marginTop: 'auto' }}>
        <button onClick={logout} className="admin-btn danger" style={{ width: 'auto' }}>
          <span className="material-symbols-outlined">logout</span>
          Cerrar sesión
        </button>
      </footer>
    </div>
  );
}
