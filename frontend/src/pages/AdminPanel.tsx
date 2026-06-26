import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

import html2canvas from 'html2canvas';
import ShareStatsImage from '../components/ShareStatsImage';

import { listarUsuarios, crearUsuario, desactivarUsuario, actualizarUsuario } from '../api/usuarios';
import { listarPartidos, generarFixture, eliminarFixture, cargarResultado, cerrarFase } from '../api/partidos';
import { obtenerConfiguracion, actualizarConfiguracion } from '../api/configuracion';
import { obtenerAdminStats, obtenerAdminInsights, obtenerPronosticosUsuario, obtenerShareData, enviarTestPushGlobal } from '../api/admin';
import type { AdminStats, AdminInsights } from '../api/admin';
import { getFlagUrl } from '../utils/flags';
import UserAvatar from '../components/UserAvatar';
import FormUsuario from '../components/FormUsuario';
import ModalResultado from '../components/ModalResultado';
import type { Usuario, Partido, ConfiguracionPuntos, Pronostico } from '../types';

type Tab = 'dashboard' | 'usuarios' | 'cargar' | 'finalizados' | 'buscador' | 'configuracion';

export default function AdminPanel() {
  const { usuario, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const shareRef = useRef<HTMLDivElement>(null);
  const [generandoImagen, setGenerandoImagen] = useState(false);
  const [shareFiltro, setShareFiltro] = useState('global');
  const [shareDataVisual, setShareDataVisual] = useState<any>(null);
  const [shareContextoVisual, setShareContextoVisual] = useState('Resumen Global');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [partidoModal, setPartidoModal] = useState<Partido | null>(null);
  const [faseFiltro, setFaseFiltro] = useState('grupos');
  const [grupoFiltro, setGrupoFiltro] = useState('');
  const [jornadaFiltro, setJornadaFiltro] = useState(''); // Nuevo filtro de jornada

  // Estados del Buscador
  const [buscadorUsuarioId, setBuscadorUsuarioId] = useState<string>('');
  const [buscadorPronosticos, setBuscadorPronosticos] = useState<Pronostico[]>([]);
  const [buscando, setBuscando] = useState(false);

  const [configPuntos, setConfigPuntos] = useState<ConfiguracionPuntos | null>(null);

  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [cerrandoFase, setCerrandoFase] = useState(false);
  const [enviandoTestPush, setEnviandoTestPush] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    setSidebarOpen(false); // Close sidebar on tab change (mobile)
    
    if (tab === 'dashboard') {
      fetchStats();
      fetchInsights();
      fetchPartidos(); // Necesitamos los partidos cargados para poder calcular los filtros del share
    }
    else if (tab === 'usuarios' || tab === 'buscador') fetchUsuarios();
    else if (tab === 'cargar' || tab === 'finalizados') fetchPartidos();
    else if (tab === 'configuracion') fetchConfig();
  }, [tab, usuario]);

  // Fetch all administrative data for the dashboard tabs
  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await obtenerAdminStats();
      setStats(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const data = await obtenerAdminInsights();
      console.log('[ADMIN] Insights cargados:', data);
      setInsights(data);
    } catch (err) { 
      console.error('Error al cargar insights:', err); 
    } finally {
      setLoadingInsights(false);
    }
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

  const handleBuscarPronosticos = async (userId: string) => {
    setBuscadorUsuarioId(userId);
    if (!userId) {
      setBuscadorPronosticos([]);
      return;
    }

    setBuscando(true);
    try {
      const data = await obtenerPronosticosUsuario(parseInt(userId, 10));
      setBuscadorPronosticos(data);
    } catch (err) {
      console.error('Error al buscar pronosticos:', err);
    } finally {
      setBuscando(false);
    }
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


  const handleCrearOEditarUsuario = async (nombre: string, email: string, rol: 'admin' | 'user') => {
    try {
      if (usuarioEditando) {
        await actualizarUsuario(usuarioEditando.id, { nombre, email, rol });
        setMensaje('Usuario actualizado correctamente');
      } else {
        await crearUsuario(nombre, email, rol);
        setMensaje('Usuario creado correctamente');
      }
      setMostrarForm(false);
      setUsuarioEditando(null);
      fetchUsuarios();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleEditClick = (u: Usuario) => {
    setUsuarioEditando(u);
    setMostrarForm(true);
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

  const handleEnviarTestGlobal = async () => {
    console.log('[ADMIN-PUSH] handleEnviarTestGlobal iniciado.');
    if (!window.confirm('¿Enviar una notificación de prueba a TODOS los usuarios registrados con alertas activas?')) {
      console.log('[ADMIN-PUSH] Envío global cancelado por el usuario.');
      return;
    }
    setEnviandoTestPush(true);
    setMensaje('');
    try {
      console.log('[ADMIN-PUSH] Enviando solicitud POST a /api/admin/test-push-global...');
      const res = await enviarTestPushGlobal();
      console.log('[ADMIN-PUSH] Respuesta exitosa recibida del servidor:', res);
      setMensaje(res.mensaje);
    } catch (err: any) {
      console.error('[ADMIN-PUSH] Error capturado al enviar notificación global:', err);
      const errMsg = err.response?.data?.error || err.message || 'Error al enviar notificación de prueba global';
      console.error('[ADMIN-PUSH] Mensaje de error formateado a mostrar:', errMsg);
      setMensaje(errMsg);
    } finally {
      console.log('[ADMIN-PUSH] Finalizado handleEnviarTestGlobal, reseteando estado.');
      setEnviandoTestPush(false);
    }
  };

  const getIdsForFilter = (filtro: string): number[] | undefined => {
    if (filtro === 'global') return undefined;
    if (filtro === 'grupos') return partidos.filter(p => p.fase === 'grupos').map(p => p.id);
    if (filtro === 'fase_final') return partidos.filter(p => p.fase !== 'grupos').map(p => p.id);
    
    if (filtro.startsWith('jornada')) {
      const numJornada = filtro.replace('jornada', '');
      const gruposPartidos = partidos.filter(p => p.fase === 'grupos').reduce((acc, p) => {
        if (!acc[p.grupo || '']) acc[p.grupo || ''] = [];
        acc[p.grupo || ''].push(p);
        return acc;
      }, {} as Record<string, Partido[]>);
      
      const ids: number[] = [];
      Object.values(gruposPartidos).forEach(gp => {
        gp.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
        if (numJornada === '1') {
          if (gp[0]) ids.push(gp[0].id);
          if (gp[1]) ids.push(gp[1].id);
        } else if (numJornada === '2') {
          if (gp[2]) ids.push(gp[2].id);
          if (gp[3]) ids.push(gp[3].id);
        } else if (numJornada === '3') {
          if (gp[4]) ids.push(gp[4].id);
          if (gp[5]) ids.push(gp[5].id);
        }
      });
      return ids;
    }
    return undefined;
  };

  const getLabelForFilter = (filtro: string) => {
    if (filtro === 'global') return 'Resumen Global';
    if (filtro === 'grupos') return 'Fase de Grupos';
    if (filtro === 'fase_final') return 'Fase Final';
    if (filtro.startsWith('jornada')) return `Jornada ${filtro.replace('jornada', '')}`;
    return 'Resumen';
  };

  const handleDescargarStats = async () => {
    setGenerandoImagen(true);
    try {
      const ids = getIdsForFilter(shareFiltro);
      const data = await obtenerShareData(ids);
      setShareDataVisual(data);
      setShareContextoVisual(getLabelForFilter(shareFiltro));
      
      // Esperamos a que React renderice el componente oculto con los nuevos datos
      await new Promise(resolve => setTimeout(resolve, 500)); 

      if (!shareRef.current) throw new Error("Referencia a la imagen no encontrada");

      const canvas = await html2canvas(shareRef.current, {
        scale: 2, // High resolution
        backgroundColor: '#101415',
        logging: false,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `prode_stats_${shareFiltro}_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (err) {
      console.error('Error al generar imagen:', err);
      setMensaje('Error al generar la imagen de estadísticas');
    } finally {
      setGenerandoImagen(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'usuarios', label: 'Usuarios', icon: 'group' },
    { id: 'buscador', label: 'Buscador', icon: 'search' },
    { id: 'cargar', label: 'Cargar Resultados', icon: 'edit_square' },
    { id: 'finalizados', label: 'Finalizados', icon: 'sports_soccer' },
    { id: 'configuracion', label: 'Configuración', icon: 'settings' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
          <Link to="/" className="nav-logo" style={{ fontSize: '1.1rem' }}>
            <span className="material-symbols-outlined nav-icon" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
            PRODE BSC 2026
          </Link>
          <p style={{ fontSize: '0.65rem', color: 'var(--outline)', marginTop: '0.5rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Panel de Control
          </p>
        </div>

        <nav className="sidebar-nav" style={{ flex: 1, padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
          <div className="sidebar-label" style={{ padding: '0.5rem 1.5rem', fontSize: '0.6rem', fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Administración
          </div>
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
                padding: '0.85rem 1.5rem',
                border: 'none',
                background: tab === t.id ? 'rgba(177, 198, 249, 0.1)' : 'transparent',
                color: tab === t.id ? 'var(--primary)' : 'var(--on-surface-variant)',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'Anybody',
                fontSize: '0.8rem',
                fontWeight: tab === t.id ? 700 : 500,
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}

          <div className="sidebar-separator" style={{ height: '1px', background: 'var(--border)', margin: '1rem 1.5rem' }} />
          
          <div className="sidebar-label" style={{ padding: '0.5rem 1.5rem', fontSize: '0.6rem', fontWeight: 800, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Navegación Pública
          </div>
          
          <Link to="/ranking" style={{ 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.85rem 1.5rem',
            color: 'var(--on-surface-variant)',
            borderRadius: '12px',
            fontFamily: 'Anybody',
            fontSize: '0.8rem',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>leaderboard</span>
            Ver Ranking
          </Link>

          <Link to="/dashboard" style={{ 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.85rem 1.5rem',
            color: 'var(--on-surface-variant)',
            borderRadius: '12px',
            fontFamily: 'Anybody',
            fontSize: '0.8rem',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>dashboard</span>
            Mi Prode
          </Link>
        </nav>


        <div className="sidebar-footer" style={{ padding: '2rem 1rem 3rem' }}>
          <button 
            onClick={logout} 
            className="admin-btn danger" 
            style={{ width: '100%', justifyContent: 'center', borderRadius: '12px' }}
          >
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </button>
        </div>

      </aside>


      {/* Main Content */}
      <main className="admin-main page">
        {/* Toggle only visible on tablet/mobile where sidebar is hidden */}
        <button 
          className="admin-sidebar-toggle" 
          onClick={() => setSidebarOpen(true)}
          style={{ marginBottom: '2rem', marginLeft: 0 }}
        >
          <span className="material-symbols-outlined">settings_accessibility</span>
          Opciones Admin
        </button>

        {mensaje && (
          <div className="success-message" style={{ marginBottom: '2rem' }}>
            <span>{mensaje}</span>
            <button onClick={() => setMensaje('')}>✕</button>
          </div>
        )}

        {tab === 'dashboard' && (
          <section className="admin-section">
            <header className="admin-header" style={{ marginBottom: '2.5rem' }}>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '2rem' }}>monitoring</span>
                Dashboard Admin
              </h1>
              <p className="subtitle">Resumen general del estado del sistema y participación.</p>
            </header>

            {loading ? (
              <div className="admin-config-grid">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="skeleton-card" style={{ height: '120px' }}></div>
                ))}
              </div>
            ) : stats ? (
              <>
                <div className="admin-config-grid">
                  <div className="config-card glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <label>Usuarios Totales</label>
                        <div className="stat-value">{stats.totalUsuarios}</div>
                      </div>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', opacity: 0.5 }}>group</span>
                    </div>
                    <p className="hint">Registrados en total.</p>
                  </div>
                  <div className="config-card glass-card" style={{ borderLeft: '4px solid var(--tertiary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <label>Engagement</label>
                        <div className="stat-value">{stats.tasaCobertura}%</div>
                      </div>
                      <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)', opacity: 0.5 }}>bolt</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden' }}>
                      <div style={{ width: `${stats.tasaCobertura}%`, height: '100%', background: 'var(--tertiary)', transition: 'width 1s ease-out' }}></div>
                    </div>
                    <p className="hint" style={{ marginTop: '0.25rem' }}>Pronósticos vs Posibles.</p>
                  </div>
                  <div className="config-card glass-card" style={{ borderLeft: '4px solid #00F0FF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <label>Pronósticos</label>
                        <div className="stat-value">{stats.totalPronosticos}</div>
                      </div>
                      <span className="material-symbols-outlined" style={{ color: '#00F0FF', opacity: 0.5 }}>analytics</span>
                    </div>
                    <p className="hint">Predicciones cargadas.</p>
                  </div>
                  <div className="config-card glass-card" style={{ borderLeft: '4px solid var(--primary-fixed)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <label>Partidos</label>
                        <div className="stat-value">{stats.partidosFinalizados} / {stats.totalPartidos}</div>
                      </div>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary-fixed)', opacity: 0.5 }}>sports_soccer</span>
                    </div>
                    <p className="hint">Finalizados vs Total.</p>
                  </div>
                  <div className="config-card glass-card" style={{ borderLeft: '4px solid #00e5ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <label>Alertas Push Activas</label>
                        <div className="stat-value">{stats.usuariosConPush}</div>
                      </div>
                      <span className="material-symbols-outlined" style={{ color: '#00e5ff', opacity: 0.5 }}>notifications_active</span>
                    </div>
                    <p className="hint">Usuarios con push activado.</p>
                  </div>
                </div>

                {/* Nuevas Secciones de Insights */}
                {loadingInsights && (
                  <div className="admin-grid-v2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                    {[1, 2, 3].map(i => <div key={i} className="skeleton-card" style={{ height: '200px' }}></div>)}
                  </div>
                )}

                {!loadingInsights && insights && (
                  <div className="admin-grid-v2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                    
                    {/* El Oráculo */}
                    <div className="glass-card" style={{ padding: '2rem', borderRadius: '20px', borderTop: '4px solid #ffcc00' }}>
                      <header style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="material-symbols-outlined" style={{ color: '#ffcc00' }}>auto_awesome</span>
                        <h3 style={{ fontFamily: 'Anybody', fontSize: '0.9rem', textTransform: 'uppercase', margin: 0 }}>El Oráculo (Tendencias)</h3>
                      </header>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>Favorito Campeón</span>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{insights.oraculo.favorito}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>Partido más dudoso</span>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', textAlign: 'right', maxWidth: '150px' }}>{insights.oraculo.partidoMasEmpatado}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>Marcador popular</span>
                          <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem' }}>{insights.oraculo.marcadorComun}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rendimiento Global */}
                    <div className="glass-card" style={{ padding: '2rem', borderRadius: '20px', borderTop: '4px solid #00e476' }}>
                      <header style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="material-symbols-outlined" style={{ color: '#00e476' }}>speed</span>
                        <h3 style={{ fontFamily: 'Anybody', fontSize: '0.9rem', textTransform: 'uppercase', margin: 0 }}>Calidad de Juego</h3>
                      </header>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>Promedio de Puntos</span>
                          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--on-surface)' }}>{insights.calidad.promedioPuntos} <small style={{ fontSize: '0.6rem', opacity: 0.5 }}>pts/u</small></span>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(0, 228, 118, 0.05)', borderRadius: '12px', border: '1px solid rgba(0, 228, 118, 0.1)' }}>
                          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: '#00e476', marginBottom: '0.5rem' }}>Mayor Efectividad</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{insights.calidad.mejorEfectividad.nombre}</span>
                            <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>{insights.calidad.mejorEfectividad.porcentaje}% <small style={{ fontSize: '0.6rem', opacity: 0.5 }}>🎯</small></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Monitoreo Técnico */}
                    <div className="glass-card" style={{ padding: '2rem', borderRadius: '20px', borderTop: '4px solid #b1c6f9' }}>
                      <header style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="material-symbols-outlined" style={{ color: '#b1c6f9' }}>security</span>
                        <h3 style={{ fontFamily: 'Anybody', fontSize: '0.9rem', textTransform: 'uppercase', margin: 0 }}>Monitor de Seguridad</h3>
                      </header>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', background: 'rgba(177, 198, 249, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b1c6f9' }}>
                            <span className="material-symbols-outlined">login</span>
                          </div>
                          <div>
                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{insights.seguridad.conexionesHoy}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--outline)', textTransform: 'uppercase' }}>Logins (24hs)</div>
                          </div>
                        </div>
                        <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{insights.seguridad.roles.user}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--outline)', textTransform: 'uppercase' }}>Usuarios</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{insights.seguridad.roles.admin}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--outline)', textTransform: 'uppercase' }}>Admins</div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                <div className="admin-grid-v2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                  {/* Top Certeros */}
                  <div className="glass-card" style={{ padding: '2rem', borderRadius: '20px' }}>
                    <header style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="material-symbols-outlined" style={{ color: '#ffcc00' }}>military_tech</span>
                      <h3 style={{ fontFamily: 'Anybody', fontSize: '0.9rem', textTransform: 'uppercase', margin: 0 }}>Top Pronosticadores Certeros</h3>
                    </header>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {stats.topCerteros.map((u, i) => (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--outline)', width: '20px' }}>{i + 1}</div>
                          <UserAvatar name={u.avatarSeed || u.nombre} size={32} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{u.nombre}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--outline)' }}>{u.email}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--tertiary)' }}>{u.aciertos}</div>
                            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--outline)' }}>🎯 Exactos</div>
                          </div>
                        </div>
                      ))}
                      {stats.topCerteros.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>Aún no hay aciertos exactos.</p>}
                    </div>
                  </div>

                  {/* Usuarios Dormidos */}
                  <div className="glass-card" style={{ padding: '2rem', borderRadius: '20px' }}>
                    <header style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="material-symbols-outlined" style={{ color: '#ff6b6b' }}>notifications_paused</span>
                      <h3 style={{ fontFamily: 'Anybody', fontSize: '0.9rem', textTransform: 'uppercase', margin: 0 }}>Usuarios "Dormidos"</h3>
                    </header>
                    <p style={{ fontSize: '0.75rem', color: 'var(--outline)', marginBottom: '1rem' }}>Usuarios activos que aún no han cargado ningún pronóstico.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {stats.usuariosDormidos.map((u) => (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                          <UserAvatar name={u.nombre} size={28} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{u.nombre}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--outline)' }}>{u.email}</div>
                          </div>
                          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--outline)', opacity: 0.5 }}>mail</span>
                        </div>
                      ))}
                      {stats.usuariosDormidos.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,228,118,0.05)', borderRadius: '12px', color: 'var(--tertiary)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>verified</span>
                          <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>¡Todos los usuarios han participado!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', marginTop: '2rem' }}>
                  <h3 style={{ fontFamily: 'Anybody', fontSize: '0.9rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exportar Estadísticas</h3>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select 
                      value={shareFiltro} 
                      onChange={(e) => setShareFiltro(e.target.value)}
                      style={{ background: 'var(--surface-container-high)', border: '1px solid var(--border)', color: 'var(--on-surface)', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600, fontFamily: 'Anybody' }}
                    >
                      <option value="global">Global (Todo el torneo)</option>
                      <option value="grupos">Fase de Grupos (Completa)</option>
                      <option value="jornada1">Solo Jornada 1</option>
                      <option value="jornada2">Solo Jornada 2</option>
                      <option value="jornada3">Solo Jornada 3</option>
                      <option value="fase_final">Fase Final (Eliminatorias)</option>
                    </select>
                    <button className="admin-btn secondary" onClick={handleDescargarStats} disabled={generandoImagen}>
                      <span className="material-symbols-outlined">ios_share</span>
                      {generandoImagen ? 'Generando...' : 'Compartir Stats'}
                    </button>
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px', marginTop: '2rem' }}>
                  <h3 style={{ fontFamily: 'Anybody', fontSize: '0.9rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones Rápidas</h3>
                  <div className="admin-actions">
                    <button className="admin-btn primary" onClick={() => setTab('cargar')}>
                      <span className="material-symbols-outlined">edit_square</span>
                      Cargar Resultados
                    </button>
                    <button className="admin-btn secondary" onClick={() => setTab('usuarios')}>
                      <span className="material-symbols-outlined">manage_accounts</span>
                      Gestionar Usuarios
                    </button>
                    <button className="admin-btn secondary" onClick={handleEnviarTestGlobal} disabled={enviandoTestPush} style={{ border: '1px solid rgba(0, 229, 255, 0.25)' }}>
                      <span className="material-symbols-outlined" style={{ color: '#00e5ff' }}>send</span>
                      {enviandoTestPush ? 'Enviando...' : 'Test Alerta Global'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty glass-card" style={{ padding: '3rem', textAlign: 'center', borderRadius: '16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '1rem' }}>error</span>
                <p>No se pudieron cargar las estadísticas.</p>
              </div>
            )}
          </section>
        )}

        {tab === 'usuarios' && (
          <section className="admin-section">
            <header className="section-header">
              <div>
                <h2>Gestión de Usuarios</h2>
                <p className="subtitle" style={{ fontSize: '0.85rem' }}>Lista de participantes y administradores.</p>
              </div>
              <button className="admin-btn primary" onClick={() => { setUsuarioEditando(null); setMostrarForm(true); }}>
                <span className="material-symbols-outlined">person_add</span>
                Nuevo usuario
              </button>
            </header>

            {mostrarForm && (
              <div className="form-usuario glass-card" style={{ marginBottom: '2rem' }}>
                <FormUsuario
                  onSubmit={handleCrearOEditarUsuario}
                  onCancel={() => { setMostrarForm(false); setUsuarioEditando(null); }}
                  usuario={usuarioEditando}
                />
              </div>
            )}

            <div className="admin-config-grid" style={{ gap: '1rem' }}>
              {usuarios.map((u) => (
                <div key={u.id} className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nombre}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--outline)', margin: '0.25rem 0', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</p>
                    </div>
                    <span className={`status-badge ${u.activo ? 'active' : 'inactive'}`} style={{ flexShrink: 0 }}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <span className="fase-tag">{u.rol}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="admin-btn secondary small" onClick={() => handleEditClick(u)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>edit</span>
                      </button>
                      {u.activo && u.id !== usuario?.id && (
                        <button className="admin-btn danger small" onClick={() => handleDesactivar(u.id)}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>block</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'buscador' && (
          <section className="admin-section">
            <header className="section-header">
              <div>
                <h2>Buscador de Pronósticos</h2>
                <p className="subtitle" style={{ fontSize: '0.85rem' }}>Consulta las predicciones de un usuario específico.</p>
              </div>
            </header>

            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', width: 'fit-content', minWidth: '300px' }}>
              <label style={{ fontFamily: 'Anybody', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--outline)', display: 'block', marginBottom: '0.5rem' }}>
                Seleccionar Usuario:
              </label>
              <select 
                value={buscadorUsuarioId} 
                onChange={(e) => handleBuscarPronosticos(e.target.value)}
                style={{ 
                  width: '100%',
                  background: 'transparent', 
                  border: '1px solid var(--border)', 
                  color: 'var(--on-surface)', 
                  fontWeight: 600, 
                  padding: '0.75rem',
                  borderRadius: '8px',
                  cursor: 'pointer' 
                }}
              >
                <option value="" style={{ background: 'var(--surface-container-high)' }}>-- Elegir un usuario --</option>
                {usuarios.filter(u => u.rol === 'user').map((u) => (
                  <option key={u.id} value={u.id} style={{ background: 'var(--surface-container-high)' }}>
                    {u.nombre} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {buscando ? (
              <div className="partidos-grid">
                {[1, 2, 3].map(i => <div key={i} className="skeleton-card" style={{ height: '150px' }}></div>)}
              </div>
            ) : buscadorPronosticos.length === 0 ? (
              <div className="empty glass-card" style={{ padding: '4rem', textAlign: 'center', borderRadius: '16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '1rem' }}>person_search</span>
                <p style={{ opacity: 0.5 }}>{buscadorUsuarioId ? 'Este usuario aún no tiene pronósticos.' : 'Selecciona un usuario para ver sus datos.'}</p>
              </div>
            ) : (
              <div className="partidos-grid">
                {buscadorPronosticos.map((p) => (
                  <article key={p.id} className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', borderLeft: p.puntosObtenidos !== null ? `4px solid var(--tertiary)` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span className="fase-tag">{p.partido?.fase} {p.partido?.grupo ? `- G${p.partido.grupo}` : ''}</span>
                      {p.puntosObtenidos !== null && (
                        <span style={{ fontWeight: 800, color: 'var(--tertiary)', fontSize: '0.8rem' }}>+{p.puntosObtenidos} PTS</span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ textAlign: 'right', flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{p.partido?.equipoLocal}</div>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <div style={{ background: 'var(--surface-container-high)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 800 }}>{p.golesLocal}</div>
                        <span style={{ opacity: 0.3 }}>-</span>
                        <div style={{ background: 'var(--surface-container-high)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 800 }}>{p.golesVisitante}</div>
                      </div>
                      <div style={{ textAlign: 'left', flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{p.partido?.equipoVisitante}</div>
                    </div>

                    {p.partido?.estado === 'finalizado' && (
                      <div style={{ textAlign: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.25rem' }}>Resultado Real</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{p.partido.golesLocal} - {p.partido.golesVisitante}</div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'cargar' && (
          <section className="admin-section">
            <header className="section-header">
              <div>
                <h2>Cargar Resultados</h2>
                <p className="subtitle" style={{ fontSize: '0.85rem' }}>Ingresa los marcadores reales del torneo.</p>
              </div>
              <div className="admin-actions">
                <button className="admin-btn primary small" onClick={handleGenerarFixture} disabled={generando}>
                  {generando ? '...' : 'Generar fixture'}
                </button>
                {faseFiltro !== 'final' && faseFiltro !== '3er_puesto' && (
                  <button 
                    className="admin-btn secondary small" 
                    onClick={handleCerrarFase} 
                    disabled={cerrandoFase}
                  >
                    Cerrar {faseFiltro === 'grupos' ? 'Grupos' : faseFiltro}
                  </button>
                )}
                <button className="admin-btn danger small" onClick={handleEliminarFixture} disabled={eliminando}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>delete</span>
                </button>
              </div>
            </header>

            <nav className="fase-tabs" style={{ marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {['grupos', '16vos', '8vos', 'cuartos', 'semis', '3er_puesto', 'final'].map((f) => (
                <button
                  key={f}
                  className={`fase-tab ${faseFiltro === f ? 'active' : ''}`}
                  onClick={() => { setFaseFiltro(f); setGrupoFiltro(''); setJornadaFiltro(''); fetchPartidos(f, ''); }}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {f === 'grupos' ? 'Grupos' : f}
                </button>
              ))}
            </nav>

            {faseFiltro === 'grupos' && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <div className="grupo-filtro glass-card" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', width: 'fit-content', margin: 0 }}>
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
                <div className="grupo-filtro glass-card" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', width: 'fit-content', margin: 0 }}>
                  <label style={{ fontFamily: 'Anybody', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--outline)' }}>Jornada: </label>
                  <select value={jornadaFiltro} onChange={(e) => setJornadaFiltro(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                    <option value="" style={{ background: 'var(--surface-container-high)' }}>Todas las fechas</option>
                    <option value="1" style={{ background: 'var(--surface-container-high)' }}>Fecha 1</option>
                    <option value="2" style={{ background: 'var(--surface-container-high)' }}>Fecha 2</option>
                    <option value="3" style={{ background: 'var(--surface-container-high)' }}>Fecha 3</option>
                  </select>
                </div>
              </div>
            )}

            <div className="partidos-grid">
              {(() => {
                let filtrados = partidos.filter((p) => p.estado !== 'finalizado');
                
                if (faseFiltro === 'grupos' && jornadaFiltro) {
                  // Agrupar por letra de grupo para inferir la jornada cronológicamente
                  const partidosConJornada = filtrados.reduce((acc, p) => {
                    if (!acc[p.grupo || '']) acc[p.grupo || ''] = [];
                    acc[p.grupo || ''].push(p);
                    return acc;
                  }, {} as Record<string, Partido[]>);

                  Object.values(partidosConJornada).forEach(grupoPartidos => {
                    grupoPartidos.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
                    grupoPartidos.forEach((p, index) => {
                      if (index < 2) (p as any)._jornada = '1';
                      else if (index < 4) (p as any)._jornada = '2';
                      else (p as any)._jornada = '3';
                    });
                  });
                  
                  filtrados = filtrados.filter(p => (p as any)._jornada === jornadaFiltro);
                }

                return filtrados.map((p) => (
                  <article key={p.id} className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span className="fase-tag">{p.fase} {p.grupo ? `- Grupo ${p.grupo}` : ''}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>
                        {new Date(p.fechaHora).toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        {getFlagUrl(p.equipoLocal) && <img className="flag-icon" src={getFlagUrl(p.equipoLocal)} alt="" style={{ width: '24px', height: '18px', marginBottom: '0.25rem' }} />}
                        <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{p.equipoLocal}</div>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--outline)', opacity: 0.5 }}>VS</span>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        {getFlagUrl(p.equipoVisitante) && <img className="flag-icon" src={getFlagUrl(p.equipoVisitante)} alt="" style={{ width: '24px', height: '18px', marginBottom: '0.25rem' }} />}
                        <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{p.equipoVisitante}</div>
                      </div>
                    </div>
                    <button 
                      className="admin-btn primary" 
                      style={{ width: '100%', marginTop: '1rem' }}
                      onClick={() => setPartidoModal(p)}
                    >
                      <span className="material-symbols-outlined">add_circle</span>
                      Cargar Resultado
                    </button>
                  </article>
                ));
              })()}
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

            <nav className="fase-tabs" style={{ marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {['grupos', '16vos', '8vos', 'cuartos', 'semis', '3er_puesto', 'final'].map((f) => (
                <button
                  key={f}
                  className={`fase-tab ${faseFiltro === f ? 'active' : ''}`}
                  onClick={() => { setFaseFiltro(f); setGrupoFiltro(''); fetchPartidos(f, ''); }}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {f === 'grupos' ? 'Grupos' : f}
                </button>
              ))}
            </nav>

            <div className="partidos-grid">
              {partidos.filter((p) => p.estado === 'finalizado').map((p) => (
                <article key={p.id} className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px', opacity: 0.9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span className="fase-tag" style={{ background: 'rgba(0, 228, 118, 0.1)', color: 'var(--primary)' }}>FINALIZADO</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{new Date(p.fechaHora).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      {getFlagUrl(p.equipoLocal) && <img className="flag-icon" src={getFlagUrl(p.equipoLocal)} alt="" style={{ width: '24px', height: '18px', marginBottom: '0.25rem' }} />}
                      <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{p.equipoLocal}</div>
                    </div>
                    <div style={{ background: 'var(--surface-container-high)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 900, fontFamily: 'Anybody' }}>
                      {p.golesLocal} - {p.golesVisitante}
                    </div>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      {getFlagUrl(p.equipoVisitante) && <img className="flag-icon" src={getFlagUrl(p.equipoVisitante)} alt="" style={{ width: '24px', height: '18px', marginBottom: '0.25rem' }} />}
                      <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{p.equipoVisitante}</div>
                    </div>
                  </div>
                  {p.ganadorNombre && (
                    <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.6rem', color: 'var(--tertiary)', fontFamily: 'Anybody', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                <p className="subtitle" style={{ fontSize: '0.85rem' }}>Define los puntos que los usuarios ganan.</p>
              </div>
            </header>
            
            <form onSubmit={handleActualizarConfig}>
              <div className="admin-config-grid">
                <div className="config-card glass-card">
                  <label>Resultado Exacto</label>
                  <input 
                    type="number" 
                    value={configPuntos.exacto} 
                    onChange={(e) => setConfigPuntos({ ...configPuntos, exacto: parseInt(e.target.value, 10) || 0 })} 
                  />
                  <p className="hint">Acierto marcador exacto.</p>
                </div>
                <div className="config-card glass-card">
                  <label>Diferencia de Goles</label>
                  <input 
                    type="number" 
                    value={configPuntos.diferencia} 
                    onChange={(e) => setConfigPuntos({ ...configPuntos, diferencia: parseInt(e.target.value, 10) || 0 })} 
                  />
                  <p className="hint">Ganador y diferencia.</p>
                </div>
                <div className="config-card glass-card">
                  <label>Solo Ganador</label>
                  <input 
                    type="number" 
                    value={configPuntos.ganador} 
                    onChange={(e) => setConfigPuntos({ ...configPuntos, ganador: parseInt(e.target.value, 10) || 0 })} 
                  />
                  <p className="hint">Acierto solo resultado.</p>
                </div>
                <div className="config-card glass-card">
                  <label>Error</label>
                  <input 
                    type="number" 
                    value={configPuntos.error} 
                    onChange={(e) => setConfigPuntos({ ...configPuntos, error: parseInt(e.target.value, 10) || 0 })} 
                  />
                  <p className="hint">Pronóstico fallido.</p>
                </div>
              </div>
              <button type="submit" className="admin-btn primary" style={{ padding: '1rem 3rem', marginTop: '2rem' }}>
                Guardar Configuración
              </button>
            </form>
          </section>
        )}
      </main>

      {/* Hidden element for rendering the share image */}
      {shareDataVisual && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <ShareStatsImage 
            ref={shareRef} 
            data={shareDataVisual} 
            contexto={shareContextoVisual}
          />
        </div>
      )}
    </div>
  );
}
