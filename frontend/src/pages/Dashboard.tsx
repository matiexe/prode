import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/useAuth';
import { cambiarAvatar } from '../api/auth';
import { listarPartidos } from '../api/partidos';
import { obtenerMisPronosticos, guardarPronostico } from '../api/pronosticos';
import { obtenerConfiguracion } from '../api/configuracion';
import PartidoCard from '../components/PartidoCard';
import TablaGrupo from '../components/TablaGrupo';
import UserAvatar from '../components/UserAvatar';
import type { EquipoPosicion } from '../components/TablaGrupo';
import type { Partido, Pronostico, ConfiguracionPuntos } from '../types';

export default function Dashboard() {
  const { usuario, logout, updateUsuario } = useAuth();
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [pronosticos, setPronosticos] = useState<Pronostico[]>([]);
  const [config, setConfig] = useState<ConfiguracionPuntos | null>(null);
  const [fase, setFase] = useState('grupos');
  const [grupo, setGrupo] = useState('');
  const [jornada, setJornada] = useState(''); // Nuevo filtro de jornada
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);
  const timerRef = useRef<any>(null);
  const [version, setVersion] = useState(0);
  const pendingRef = useRef<Map<number, { local: string; visitante: string }>>(new Map());
  const [pendingCount, setPendingCount] = useState(0);
  const [savingAll, setSavingAll] = useState(false);
  const [cambiandoAvatar, setCambiandoAvatar] = useState(false);

  // Estados de Notificaciones Push
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<PushSubscription | null>(null);

  const grupos = ['A','B','C','D','E','F','G','H','I','J','K','L'];

  const handleCambiarAvatar = async () => {
    setCambiandoAvatar(true);
    try {
      // Generamos un string aleatorio para el nuevo avatar
      const newSeed = Math.random().toString(36).substring(2, 10);
      const updatedUser = await cambiarAvatar(newSeed);
      updateUsuario(updatedUser);
      setMensaje({ texto: 'Avatar actualizado', tipo: 'success' });
    } catch (err) {
      console.error('Error al cambiar avatar:', err);
      setMensaje({ texto: 'Error al cambiar avatar', tipo: 'error' });
    } finally {
      setCambiandoAvatar(false);
    }
  };

  // Cargar estado de notificaciones push al iniciar
  useEffect(() => {
    console.log('[PUSH] Inicializando verificador de soporte de Service Worker y Push...');
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      console.log('[PUSH] Service Worker y PushManager están soportados.');
      setPushSupported(true);
      console.log('[PUSH] Permiso actual de notificaciones:', Notification.permission);
      setPushPermission(Notification.permission);
      
      console.log('[PUSH] Esperando a que el Service Worker esté listo...');
      navigator.serviceWorker.ready.then((reg) => {
        console.log('[PUSH] Service Worker listo. Buscando suscripción push existente...');
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            console.log('[PUSH] Suscripción push existente encontrada en el navegador:', sub.endpoint);
            setPushSubscribed(true);
            setActiveSubscription(sub);
          } else {
            console.log('[PUSH] No se encontró ninguna suscripción push existente en este navegador.');
          }
        }).catch((err) => {
          console.error('[PUSH] Error al obtener suscripción push existente:', err);
        });
      }).catch((err) => {
        console.error('[PUSH] Error al esperar el Service Worker listo:', err);
      });
    } else {
      console.warn('[PUSH] Service Worker o PushManager NO están soportados en este navegador/dispositivo.');
    }
  }, []);

  const handleTogglePush = async () => {
    console.log('[PUSH] handleTogglePush iniciado. pushSupported:', pushSupported, 'pushSubscribed:', pushSubscribed);
    if (!pushSupported) {
      console.warn('[PUSH] Notificaciones push no soportadas en este navegador.');
      return;
    }
    setSubscribing(true);

    try {
      console.log('[PUSH] Esperando que el Service Worker esté listo...');
      const reg = await navigator.serviceWorker.ready;
      console.log('[PUSH] Service Worker listo. Estado de la suscripción:', activeSubscription ? 'Existe' : 'No existe');
      
      if (pushSubscribed && activeSubscription) {
        console.log('[PUSH] Iniciando proceso de desuscripción...');
        console.log('[PUSH] Desuscribiendo en el navegador para el endpoint:', activeSubscription.endpoint);
        await activeSubscription.unsubscribe();
        
        console.log('[PUSH] Importando api/notificaciones para desuscribir...');
        const { desuscribirPush } = await import('../api/notificaciones');
        
        console.log('[PUSH] Enviando desuscripción al backend...');
        await desuscribirPush(activeSubscription.endpoint);
        
        setPushSubscribed(false);
        setActiveSubscription(null);
        setMensaje({ texto: 'Notificaciones desactivadas', tipo: 'success' });
        console.log('[PUSH] Desuscripción completada con éxito.');
      } else {
        console.log('[PUSH] Iniciando proceso de suscripción...');
        console.log('[PUSH] Solicitando permiso de notificaciones...');
        const permission = await Notification.requestPermission();
        console.log('[PUSH] Permiso otorgado por el usuario:', permission);
        setPushPermission(permission);
        
        if (permission !== 'granted') {
          console.warn('[PUSH] Permiso denegado por el usuario.');
          setMensaje({ texto: 'Permiso denegado para recibir notificaciones', tipo: 'error' });
          setSubscribing(false);
          return;
        }

        console.log('[PUSH] Importando api/notificaciones para suscribir...');
        const { getVapidPublicKey, suscribirPush } = await import('../api/notificaciones');
        
        console.log('[PUSH] Obteniendo clave pública VAPID del backend...');
        const vapidPublicKey = await getVapidPublicKey();
        console.log('[PUSH] Clave pública VAPID obtenida:', vapidPublicKey);
        
        console.log('[PUSH] Convirtiendo clave VAPID a Uint8Array...');
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
        
        console.log('[PUSH] Suscribiendo al PushManager del navegador...');
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
        console.log('[PUSH] Suscripción obtenida del navegador:', sub);

        console.log('[PUSH] Enviando suscripción al backend...');
        await suscribirPush(sub);
        console.log('[PUSH] Suscripción registrada con éxito en el backend.');

        setPushSubscribed(true);
        setActiveSubscription(sub);
        setMensaje({ texto: '¡Notificaciones activadas con éxito!', tipo: 'success' });
      }
    } catch (err: any) {
      console.error('[PUSH] Error crítico durante la configuración de notificaciones push:', err);
      setMensaje({ texto: 'Error al configurar notificaciones: ' + (err.message || ''), tipo: 'error' });
    } finally {
      console.log('[PUSH] Finalizando handleTogglePush, seteando subscribing a false.');
      setSubscribing(false);
      setTimeout(() => setMensaje(null), 4000);
    }
  };

  const handleTestNotification = async () => {
    console.log('[PUSH] handleTestNotification iniciado.');
    try {
      console.log('[PUSH] Importando api/notificaciones para prueba...');
      const { enviarNotificacionTest } = await import('../api/notificaciones');
      
      console.log('[PUSH] Solicitando envío de notificación de prueba al backend...');
      await enviarNotificacionTest();
      setMensaje({ texto: 'Notificación de prueba enviada', tipo: 'success' });
      console.log('[PUSH] Petición de prueba finalizada correctamente.');
    } catch (err: any) {
      console.error('[PUSH] Error al enviar notificación de prueba:', err);
      setMensaje({ texto: 'Error al enviar prueba: ' + (err.response?.data?.error || err.message), tipo: 'error' });
    }
    setTimeout(() => setMensaje(null), 4000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!usuario) return;
    const fetchData = async () => {
      setLoading(true);
      const t = Date.now();
      
      try {
        const [partidosRes, pronoRes, configRes] = await Promise.allSettled([
          listarPartidos(undefined, undefined, t),
          obtenerMisPronosticos(t),
          obtenerConfiguracion(t)
        ]);

        if (partidosRes.status === 'fulfilled') setPartidos(partidosRes.value);
        else console.error('[DASHBOARD] Error al cargar partidos:', (partidosRes as any).reason);

        if (pronoRes.status === 'fulfilled') setPronosticos(pronoRes.value);
        else console.error('[DASHBOARD] Error al cargar pronósticos:', (pronoRes as any).reason);

        if (configRes.status === 'fulfilled') setConfig(configRes.value);
        else console.error('[DASHBOARD] Error al cargar configuración:', (configRes as any).reason);

        if (partidosRes.status === 'rejected' && pronoRes.status === 'rejected') {
          throw new Error('No se pudo conectar con el servidor');
        }

      } catch (err: any) {
        console.error('[DASHBOARD] Error crítico:', err);
        setMensaje({ 
          texto: 'Conexión lenta detectada. Los datos se están cargando...', 
          tipo: 'error' 
        });
        setTimeout(fetchData, 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [usuario]);

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

  const tablaProyectada = useMemo(() => {
    if (fase !== 'grupos' || !grupo) return null;

    const tabla: Record<string, EquipoPosicion> = {};
    const initEquipo = (nombre: string) => {
      if (!tabla[nombre]) {
        tabla[nombre] = { equipo: nombre, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
      }
    };

    partidos.forEach(p => {
      if (p.grupo !== grupo) return;
      
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
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.equipo.localeCompare(b.equipo);
    });
  }, [partidos, pronosticos, grupo, fase, version]);

  const todasLasFases = ['grupos', '16vos', '8vos', 'cuartos', 'semis', '3er_puesto', 'final'];

  const fasesHabilitadas = useMemo(() => {
    const habilitadas = new Set(['grupos']);
    todasLasFases.slice(1).forEach(f => {
      const tieneEquiposDefinidos = partidos.some(p => 
        p.fase === f && 
        p.equipoLocal !== 'Por definir' && 
        p.equipoLocal !== 'TBD' &&
        p.equipoVisitante !== 'Por definir' &&
        p.equipoVisitante !== 'TBD'
      );
      if (tieneEquiposDefinidos) habilitadas.add(f);
    });
    return habilitadas;
  }, [partidos]);

  const statsSummary = useMemo(() => {
    if (!config) return { total: 0, certeros: 0, parciales: 0 };
    
    return pronosticos.reduce((acc, p) => {
      const pts = p.puntosObtenidos ?? 0;
      if (pts === 0) return acc;

      if (pts === config.exacto) {
        acc.certeros++;
      } else {
        acc.parciales++;
      }
      acc.total += pts;
      return acc;
    }, { total: 0, certeros: 0, parciales: 0 });
  }, [pronosticos, config]);

  const partidosFiltrados = useMemo(() => {
    let filtrados = partidos.filter(p => p.fase === fase);
    
    if (fase === 'grupos') {
      // Inferencia dinámica de jornadas
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

      if (grupo) {
        filtrados = filtrados.filter(p => p.grupo === grupo);
      }
      
      if (jornada) {
        filtrados = filtrados.filter(p => (p as any)._jornada === jornada);
      }
    }

    return filtrados.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  }, [partidos, fase, grupo, jornada]);
  
  const hoy = new Date();
  
  const esMismoDia = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const partidosDeHoy = partidos.filter(p => {
    const pFecha = new Date(p.fechaHora);
    return esMismoDia(pFecha, hoy) && p.estado === 'pendiente';
  });

  const proximosPartidos = partidosDeHoy.length > 0 
    ? partidosDeHoy 
    : partidos.filter(p => p.estado === 'pendiente' && new Date(p.fechaHora) > hoy)
        .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
        .slice(0, 2);

  const tituloSeccionProximos = partidosDeHoy.length > 0 ? 'Partidos de Hoy' : 'Próximos Partidos';

  const partidosPendientesTotales = partidos.filter(
    (p) => p.estado === 'pendiente' && new Date(p.fechaHora) > hoy
  );

  const partidosPronosticados = partidosPendientesTotales.filter(
    (p) => pronosticos.some((pr) => pr.partidoId === p.id)
  );

  const faltanPronosticar = partidosPendientesTotales.length - partidosPronosticados.length;

  return (
    <div className="page dashboard">
      <div className="dashboard-header glass-card" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(0, 229, 255, 0.15)', marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="avatar-container">
            <UserAvatar name={usuario?.avatarSeed || usuario?.nombre || 'User'} size={80} className="avatar-glow" />
            <button 
              className="btn-change-avatar" 
              onClick={handleCambiarAvatar} 
              disabled={cambiandoAvatar}
              title="Cambiar Avatar"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{cambiandoAvatar ? 'sync' : 'casino'}</span>
            </button>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{ margin: 0, fontSize: '2rem' }}>Hola, {usuario?.nombre}</h1>
            <p className="subtitle" style={{ margin: '0.5rem 0 0' }}>Gestiona tus pronósticos y sigue los resultados en vivo.</p>
            {pushSupported && (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleTogglePush} 
                  disabled={subscribing}
                  className={`admin-btn ${pushSubscribed ? 'danger' : 'primary'}`}
                  style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '8px', margin: 0 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                    {pushSubscribed ? 'notifications_off' : 'notifications_active'}
                  </span>
                  {subscribing 
                    ? 'Procesando...' 
                    : pushSubscribed 
                      ? 'Desactivar Notificaciones' 
                      : 'Activar Alertas de Pronósticos'}
                </button>

                {pushSubscribed && (
                  <button 
                    onClick={handleTestNotification}
                    className="admin-btn"
                    style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '8px', margin: 0, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>send</span>
                    Probar Alerta
                  </button>
                )}

                {pushPermission === 'denied' && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: 'rgba(255, 73, 73, 0.9)', width: '100%', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>warning</span>
                    Notificaciones bloqueadas por el navegador. Habilítalas para recibir alertas de pronósticos.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="puntos-resumen-v2">
            <div className="puntos-total-v2">{statsSummary.total}</div>
            <div className="puntos-label-v2">PUNTOS TOTALES</div>
          </div>
        </div>

        <div className="stats-grid-v2">
          <div className="stat-item-v2">
            <div className="stat-icon-v2" style={{ background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff' }}>🎯</div>
            <div>
              <div className="stat-value-v2">{statsSummary.certeros}</div>
              <div className="stat-label-v2">Aciertos Certeros</div>
            </div>
          </div>
          <div className="stat-item-v2">
            <div className="stat-icon-v2" style={{ background: 'rgba(0, 228, 118, 0.1)', color: '#00e476' }}>📈</div>
            <div>
              <div className="stat-value-v2">{statsSummary.parciales}</div>
              <div className="stat-label-v2">Aciertos Parciales</div>
            </div>
          </div>
          <div className="stat-item-v2">
            <div className="stat-icon-v2" style={{ background: 'rgba(177, 198, 249, 0.1)', color: '#b1c6f9' }}>📝</div>
            <div>
              <div className="stat-value-v2">{pronosticos.length}</div>
              <div className="stat-label-v2">Partidos Jugados</div>
            </div>
          </div>
        </div>
      </div>

      {mensaje && (
        <div className={`toast ${mensaje.tipo}`}>
          <span>{mensaje.tipo === 'success' ? '✓' : '✕'}</span> {mensaje.texto}
        </div>
      )}

      {proximosPartidos.length > 0 && (
        <section className="proximos-section" style={{ marginBottom: '2.5rem' }}>
          <header style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 229, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: '#00e5ff' }}>schedule</span>
            </div>
            <h2 style={{ fontSize: '0.8rem', fontFamily: 'Anybody', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
              {tituloSeccionProximos}
            </h2>
          </header>
          <div className="partidos-grid">
            {proximosPartidos.map((p) => {
              const miProno = getPronostico(p.id);
              return (
                <PartidoCard
                  key={`next-${p.id}`}
                  partido={p}
                  golesLocal={miProno?.local}
                  golesVisitante={miProno?.visitante}
                  puntosObtenidos={miProno?.puntos}
                  onGuardar={(local, visitante) => handleGuardar(p.id, local, visitante)}
                  onInputChange={handleInputChange}
                />
              );
            })}
          </div>
        </section>
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

      {faltanPronosticar === 0 && partidosPendientesTotales.length > 0 && (
        <div className="missing-banner done">
          <span className="material-symbols-outlined">verified</span>
          <span>¡Todo listo! Has completado todos los pronósticos disponibles.</span>
        </div>
      )}

      <nav className="fase-tabs">
        {todasLasFases.filter(f => fasesHabilitadas.has(f)).map((f) => (
          <button
            key={f}
            className={`fase-tab ${fase === f ? 'active' : ''}`}
            onClick={() => { setFase(f); setGrupo(''); setJornada(''); }}
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

      <div className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: fase === 'grupos' && !grupo && !jornada && tablaProyectada ? '1fr 320px' : '1fr', gap: '2rem' }}>
        <div className="dashboard-left">
          {fase === 'grupos' && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <div className="grupo-filtro glass-card" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', width: 'fit-content', margin: 0 }}>
                <label style={{ fontFamily: 'Anybody', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--outline)' }}>Filtrar por grupo: </label>
                <select value={grupo} onChange={(e) => setGrupo(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                  <option value="" style={{ background: 'var(--surface-container-high)' }}>Todos los grupos</option>
                  {grupos.map((g) => (
                    <option key={g} value={g} style={{ background: 'var(--surface-container-high)' }}>Grupo {g}</option>
                  ))}
                </select>
              </div>
              <div className="grupo-filtro glass-card" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', width: 'fit-content', margin: 0 }}>
                <label style={{ fontFamily: 'Anybody', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--outline)' }}>Jornada: </label>
                <select value={jornada} onChange={(e) => setJornada(e.target.value)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                  <option value="" style={{ background: 'var(--surface-container-high)' }}>Todas las fechas</option>
                  <option value="1" style={{ background: 'var(--surface-container-high)' }}>Fecha 1</option>
                  <option value="2" style={{ background: 'var(--surface-container-high)' }}>Fecha 2</option>
                  <option value="3" style={{ background: 'var(--surface-container-high)' }}>Fecha 3</option>
                </select>
              </div>
            </div>
          )}

          {loading ? (
            <div className="partidos-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton" style={{ width: '60px', height: '18px' }}></div>
                    <div className="skeleton" style={{ width: '80px', height: '18px' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <div className="skeleton" style={{ width: '100px', height: '24px' }}></div>
                    <div className="skeleton" style={{ width: '40px', height: '32px' }}></div>
                    <div className="skeleton" style={{ width: '100px', height: '24px' }}></div>
                  </div>
                  <div className="skeleton skeleton-btn" style={{ marginTop: 'auto' }}></div>
                </div>
              ))}
            </div>
          ) : partidosFiltrados.length === 0 ? (
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
                {partidosFiltrados.map((partido) => {
                  const miProno = getPronostico(partido.id);
                  return (
                    <PartidoCard
                      key={partido.id}
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

        {fase === 'grupos' && !grupo && !jornada && tablaProyectada && (
          <aside className="dashboard-right">
            <header style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>analytics</span>
              <h2 style={{ fontSize: '0.8rem', fontFamily: 'Anybody', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Simulador de Posiciones
              </h2>
            </header>
            <div className="glass-card" style={{ borderRadius: '16px', padding: '1rem' }}>
              <TablaGrupo titulo={`Tu Tabla (Proyectada)`} posiciones={tablaProyectada} />
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

// Función auxiliar para convertir la clave VAPID base64 a Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
