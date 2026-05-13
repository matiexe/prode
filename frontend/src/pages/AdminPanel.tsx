import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import { listarUsuarios, crearUsuario, desactivarUsuario } from '../api/usuarios';
import { listarPartidos, generarFixture, eliminarFixture, cargarResultado } from '../api/partidos';
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
  const [cerrandoGrupos, setCerrandoGrupos] = useState(false);

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

  const handleCerrarGrupos = async () => {
    if (!window.confirm('¿Estás seguro de cerrar la fase de grupos? Esto generará automáticamente los emparejamientos de 16vos de final basados en las posiciones actuales.')) return;
    
    setCerrandoGrupos(true);
    setMensaje('');
    try {
      const res = await apiClient.post('/admin/partidos/cerrar-grupos');
      setMensaje(res.data.mensaje);
      if (tab === 'cargar') fetchPartidos();
    } catch (err: any) {
      setMensaje(err.response?.data?.error || 'Error al cerrar fase de grupos');
    } finally {
      setCerrandoGrupos(false);
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

  const handleCargarResultado = async (id: number, local: number, visitante: number) => {
    await cargarResultado(id, local, visitante);
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
      <div className="admin-header">
        <h1>Panel de Administracion</h1>
        <p className="subtitle">{usuario?.nombre}</p>
      </div>

      {mensaje && <div className="success-message">{mensaje}<button onClick={() => setMensaje('')}>X</button></div>}

      <div className="admin-tabs">
        {(['usuarios', 'cargar', 'finalizados', 'configuracion'] as Tab[]).map((t) => (
          <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'usuarios' ? 'Usuarios' :
             t === 'cargar' ? 'Cargar Resultados' :
             t === 'finalizados' ? 'Finalizados' : 'Configuracion'}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Usuarios registrados</h2>
            <button className="btn-primary" onClick={() => setMostrarForm(true)}>+ Nuevo usuario</button>
          </div>

          {mostrarForm && (
            <FormUsuario
              onSubmit={handleCrearUsuario}
              onCancel={() => setMostrarForm(false)}
            />
          )}

          <table className="admin-table">
            <thead>
              <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>{u.rol}</td>
                  <td>{u.activo ? 'Activo' : 'Inactivo'}</td>
                  <td>
                    {u.activo && u.id !== usuario?.id && (
                      <button className="btn-danger" onClick={() => handleDesactivar(u.id)}>Desactivar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'cargar' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Cargar Resultados</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={handleGenerarFixture} disabled={generando}>
                {generando ? 'Generando...' : 'Generar fixture'}
              </button>
              <button className="btn-secondary" onClick={handleCerrarGrupos} disabled={cerrandoGrupos} style={{ background: 'var(--tertiary-container)', color: 'var(--on-tertiary-container)' }}>
                {cerrandoGrupos ? 'Cerrando...' : '🏆 Cerrar fase de grupos'}
              </button>
              <button className="btn-danger" onClick={handleEliminarFixture} disabled={eliminando}>
                {eliminando ? 'Eliminando...' : 'Borrar fixture'}
              </button>
            </div>
          </div>

          <div className="fase-tabs" style={{ marginBottom: '1rem' }}>
            {['grupos', '16vos', '8vos', 'cuartos', 'semis', '3er_puesto', 'final'].map((f) => (
              <button
                key={f}
                className={`fase-tab ${faseFiltro === f ? 'active' : ''}`}
                onClick={() => { setFaseFiltro(f); setGrupoFiltro(''); fetchPartidos(f, ''); }}
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

          {faseFiltro === 'grupos' && (
            <div className="grupo-filtro" style={{ marginBottom: '1rem' }}>
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

          <div className="partidos-grid">
            {partidos.filter((p) => p.estado !== 'finalizado').map((p) => (
              <div key={p.id} className="partido-card">
                <div className="partido-header">
                  <span>{p.fase}{p.grupo ? ` - Grupo ${p.grupo}` : ''}</span>
                </div>
                <div className="partido-body">
                  <span>
                    {getFlagUrl(p.equipoLocal) ? <img className="flag-icon" src={getFlagUrl(p.equipoLocal)} srcSet={getFlagSrcset(p.equipoLocal)} alt="" /> : null}
                    {p.equipoLocal}
                  </span>
                  <span className="vs">vs</span>
                  <span>
                    {getFlagUrl(p.equipoVisitante) ? <img className="flag-icon" src={getFlagUrl(p.equipoVisitante)} srcSet={getFlagSrcset(p.equipoVisitante)} alt="" /> : null}
                    {p.equipoVisitante}
                  </span>
                  <button className="btn-secondary" onClick={() => setPartidoModal(p)}>
                    Cargar resultado
                  </button>
                </div>
              </div>
            ))}
          </div>

          {partidoModal && (
            <ModalResultado
              partido={partidoModal}
              onGuardar={handleCargarResultado}
              onClose={() => setPartidoModal(null)}
            />
          )}
        </div>
      )}

      {tab === 'finalizados' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Resultados Cargados</h2>
          </div>

          <div className="fase-tabs" style={{ marginBottom: '1rem' }}>
            {['grupos', '16vos', '8vos', 'cuartos', 'semis', '3er_puesto', 'final'].map((f) => (
              <button
                key={f}
                className={`fase-tab ${faseFiltro === f ? 'active' : ''}`}
                onClick={() => { setFaseFiltro(f); setGrupoFiltro(''); fetchPartidos(f, ''); }}
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

          {faseFiltro === 'grupos' && (
            <div className="grupo-filtro" style={{ marginBottom: '1rem' }}>
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

          {partidos.filter((p) => p.estado === 'finalizado').length === 0 ? (
            <div className="empty">No hay resultados cargados aun</div>
          ) : (
            <div className="partidos-grid">
              {partidos.filter((p) => p.estado === 'finalizado').map((p) => (
                <div key={p.id} className={`partido-card finalizado`}>
                  <div className="partido-header">
                    <span className="fase-tag">{p.fase}{p.grupo ? ` - Grupo ${p.grupo}` : ''}</span>
                    <span className="fecha">{new Date(p.fechaHora).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="partido-body">
                    <div className="equipo">
                      {getFlagUrl(p.equipoLocal) ? <img className="flag-icon" src={getFlagUrl(p.equipoLocal)} srcSet={getFlagSrcset(p.equipoLocal)} alt="" /> : null}
                      {p.equipoLocal}
                    </div>
                    <div className="marcador">
                      <span className="resultado-real">{p.golesLocal} - {p.golesVisitante}</span>
                    </div>
                    <div className="equipo">
                      {getFlagUrl(p.equipoVisitante) ? <img className="flag-icon" src={getFlagUrl(p.equipoVisitante)} srcSet={getFlagSrcset(p.equipoVisitante)} alt="" /> : null}
                      {p.equipoVisitante}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'configuracion' && configPuntos && (
        <div className="admin-section">
          <h2>Puntuacion</h2>
          <form onSubmit={handleActualizarConfig} className="config-form">
            <div className="form-group">
              <label>Resultado exacto (puntos)</label>
              <input type="number" value={configPuntos.exacto} onChange={(e) => setConfigPuntos({ ...configPuntos, exacto: parseInt(e.target.value, 10) || 0 })} />
            </div>
            <div className="form-group">
              <label>Diferencia de goles (puntos)</label>
              <input type="number" value={configPuntos.diferencia} onChange={(e) => setConfigPuntos({ ...configPuntos, diferencia: parseInt(e.target.value, 10) || 0 })} />
            </div>
            <div className="form-group">
              <label>Solo ganador (puntos)</label>
              <input type="number" value={configPuntos.ganador} onChange={(e) => setConfigPuntos({ ...configPuntos, ganador: parseInt(e.target.value, 10) || 0 })} />
            </div>
            <div className="form-group">
              <label>Error (puntos)</label>
              <input type="number" value={configPuntos.error} onChange={(e) => setConfigPuntos({ ...configPuntos, error: parseInt(e.target.value, 10) || 0 })} />
            </div>
            <button type="submit" className="btn-primary">Guardar configuracion</button>
          </form>
        </div>
      )}

      <button onClick={logout} className="btn-logout">Cerrar sesion</button>
    </div>
  );
}
