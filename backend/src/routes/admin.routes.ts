import { Router, Response } from 'express';
import { Op, fn, col } from 'sequelize';
import { Usuario } from '../models/Usuario';
import { Partido } from '../models/Partido';
import { Pronostico } from '../models/Pronostico';
import { ConfiguracionPuntos } from '../models/ConfiguracionPuntos';
import { authenticate, requireAdmin, AuthRequest } from '../middlewares/auth.middleware';
import { sequelize } from '../config/database';
import jwt from 'jsonwebtoken';

const router = Router();

// Endpoint de db-fix accesible antes del middleware global de autenticación admin
// Acepta GET y POST, y se puede autenticar con el token JWT de admin o con el ADMIN_SECRET en query/body/headers
router.all('/db-fix', async (req: any, res: Response): Promise<void> => {
  try {
    const { secret } = req.body || {};
    const querySecret = req.query.secret || req.headers['x-admin-secret'];
    const tokenSecret = secret || querySecret;
    
    let isAuthorized = false;

    // 1. Verificar si se proporcionó el ADMIN_SECRET correcto
    if (tokenSecret && tokenSecret === process.env.ADMIN_SECRET) {
      isAuthorized = true;
    } else {
      // 2. Si no, verificar autenticación por JWT normal
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwtToken = authHeader.split(' ')[1];
        const secretKey = process.env.JWT_SECRET || 'secret';
        try {
          const decoded = jwt.verify(jwtToken, secretKey) as any;
          const usuario = await Usuario.findByPk(decoded.usuarioId);
          if (usuario && usuario.activo && usuario.rol === 'admin') {
            isAuthorized = true;
          }
        } catch (e) {
          // Ignorar error de JWT
        }
      }
    }

    if (!isAuthorized) {
      res.status(401).json({ error: 'No autorizado. Se requiere token JWT de administrador o el ADMIN_SECRET correcto.' });
      return;
    }

    const { sequelize } = await import('../config/database');
    console.log('[DB-FIX] Reparación y diagnóstico de esquema...');
    
    const results: any = {
      acciones: {},
      estado_actual: []
    };
    
    const queries = [
      { name: 'ganador_nombre', sql: 'ALTER TABLE "partidos" ADD COLUMN IF NOT EXISTS "ganador_nombre" VARCHAR(255)' },
      { name: 'goles_local', sql: 'ALTER TABLE "partidos" ADD COLUMN IF NOT EXISTS "goles_local" INTEGER' },
      { name: 'goles_visitante', sql: 'ALTER TABLE "partidos" ADD COLUMN IF NOT EXISTS "goles_visitante" INTEGER' },
      { name: 'estado', sql: 'ALTER TABLE "partidos" ADD COLUMN IF NOT EXISTS "estado" VARCHAR(20) DEFAULT \'pendiente\'' },
      { name: 'ultimo_acceso', sql: 'ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "ultimo_acceso" TIMESTAMP WITH TIME ZONE' },
      { name: 'avatar_seed', sql: 'ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "avatar_seed" VARCHAR(100)' },
      {
        name: 'tabla_suscripciones_push',
        sql: `
          CREATE TABLE IF NOT EXISTS "suscripciones_push" (
            "id" SERIAL PRIMARY KEY,
            "usuario_id" INTEGER NOT NULL REFERENCES "usuarios" ("id") ON DELETE CASCADE,
            "endpoint" TEXT NOT NULL UNIQUE,
            "p256dh" VARCHAR(255) NOT NULL,
            "auth" VARCHAR(255) NOT NULL,
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
    ];

    for (const q of queries) {
      try {
        await sequelize.query(q.sql);
        results.acciones[q.name] = 'OK';
      } catch (err: any) {
        results.acciones[q.name] = `ERROR: ${err.message}`;
      }
    }

    try {
      const [columns]: any = await sequelize.query(`
        SELECT table_schema, table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'partidos'
        ORDER BY table_schema, ordinal_position
      `);
      results.estado_actual = columns;
    } catch (diagErr: any) {
      results.diagnostico_error = diagErr.message;
    }

    // Verificar si faltan los partidos de eliminatorias en la base de datos
    const { Partido } = await import('../models/Partido');
    const countEliminatorias = await Partido.count({
      where: {
        fase: {
          [Op.in]: ['16vos', '8vos', 'cuartos', 'semis', '3er_puesto', 'final']
        }
      }
    });

    const fechas16vos = [
      '2026-06-28T19:00:00Z', // P73: June 28 at 19:00 UTC (16:00 ART)
      '2026-06-29T20:30:00Z', // P74: June 29 at 16:30 local (EDT = UTC-4) -> 20:30 UTC (17:30 ART)
      '2026-06-30T01:00:00Z', // P75: June 29 at 20:00 local (CDT = UTC-5) -> 01:00 UTC June 30 (22:00 ART June 29)
      '2026-06-29T17:00:00Z', // P76: June 29 at 12:00 local (CDT = UTC-5) -> 17:00 UTC (14:00 ART)
      '2026-07-01T02:00:00Z', // P77: June 30 at 22:00 local (EDT = UTC-4) -> 02:00 UTC July 1 (23:00 ART June 30)
      '2026-06-30T23:00:00Z', // P78: June 30 at 18:00 local (CDT = UTC-5) -> 23:00 UTC (20:00 ART)
      '2026-07-01T01:00:00Z', // P79: June 30 at 19:00 local (CST = UTC-6) -> 01:00 UTC July 1 (22:00 ART June 30)
      '2026-07-01T20:00:00Z', // P80: July 1 at 16:00 local (EDT = UTC-4) -> 20:00 UTC (17:00 ART)
      '2026-07-02T00:00:00Z', // P81: July 1 at 17:00 local (PDT = UTC-7) -> 00:00 UTC July 2 (21:00 ART July 1)
      '2026-07-01T20:00:00Z', // P82: July 1 at 13:00 local (PDT = UTC-7) -> 20:00 UTC (17:00 ART)
      '2026-07-02T23:00:00Z', // P83: July 2 at 19:00 local (EDT = UTC-4) -> 23:00 UTC (20:00 ART)
      '2026-07-02T19:00:00Z', // P84: July 2 at 12:00 local (PDT = UTC-7) -> 19:00 UTC (16:00 ART)
      '2026-07-03T03:00:00Z', // P85: July 2 at 20:00 local (PDT = UTC-7) -> 03:00 UTC July 3 (00:00 ART July 3)
      '2026-07-03T22:00:00Z', // P86: July 3 at 18:00 local (EDT = UTC-4) -> 22:00 UTC (19:00 ART)
      '2026-07-04T01:30:00Z', // P87: July 3 at 20:30 local (CDT = UTC-5) -> 01:30 UTC July 4 (22:30 ART July 3)
      '2026-07-03T18:00:00Z', // P88: July 3 at 13:00 local (CDT = UTC-5) -> 18:00 UTC (15:00 ART)
    ];
    const fechas8vos = [
      '2026-07-04T17:00:00Z', // P89
      '2026-07-04T21:00:00Z', // P90
      '2026-07-05T17:00:00Z', // P91
      '2026-07-05T21:00:00Z', // P92
      '2026-07-06T17:00:00Z', // P93
      '2026-07-06T21:00:00Z', // P94
      '2026-07-07T17:00:00Z', // P95
      '2026-07-07T21:00:00Z', // P96
    ];
    const fechasCuartos = [
      '2026-07-09T19:00:00Z', // P97
      '2026-07-10T19:00:00Z', // P98
      '2026-07-11T17:00:00Z', // P99
      '2026-07-11T21:00:00Z', // P100
    ];
    const fechasSemis = [
      '2026-07-14T19:00:00Z', // P101
      '2026-07-15T19:00:00Z', // P102
    ];
    const fechas3erPuesto = [
      '2026-07-18T17:00:00Z', // P103
    ];
    const fechasFinal = [
      '2026-07-19T18:00:00Z', // P104
    ];

    const fasesEliminatorias: Array<{ fase: '16vos' | '8vos' | 'cuartos' | 'semis' | '3er_puesto' | 'final'; fechas: string[] }> = [
      { fase: '16vos', fechas: fechas16vos },
      { fase: '8vos', fechas: fechas8vos },
      { fase: 'cuartos', fechas: fechasCuartos },
      { fase: 'semis', fechas: fechasSemis },
      { fase: '3er_puesto', fechas: fechas3erPuesto },
      { fase: 'final', fechas: fechasFinal },
    ];

    if (countEliminatorias === 0) {
      console.log('[DB-FIX] Generando partidos de eliminatorias faltantes...');
      const partidosToCreate: any[] = [];
      for (const { fase, fechas } of fasesEliminatorias) {
        for (let i = 0; i < fechas.length; i++) {
          partidosToCreate.push({
            fase,
            grupo: null,
            equipoLocal: 'Por definir',
            equipoVisitante: 'Por definir',
            fechaHora: new Date(fechas[i]),
            estado: 'pendiente'
          });
        }
      }
      
      await Partido.bulkCreate(partidosToCreate);
      results.acciones['generacion_eliminatorias'] = `Creados ${partidosToCreate.length} partidos de eliminatorias (16vos, 8vos, etc.) faltantes.`;
    } else {
      results.acciones['generacion_eliminatorias'] = `Los partidos de eliminatorias ya existen en la base de datos (${countEliminatorias} partidos encontrados).`;
      
      // Actualizar las fechas de los partidos existentes para corregirlos
      let totalActualizados = 0;
      for (const fa of fasesEliminatorias) {
        const partidosFase = await Partido.findAll({
          where: { fase: fa.fase },
          order: [['id', 'ASC']]
        });
        for (let i = 0; i < partidosFase.length; i++) {
          if (fa.fechas[i]) {
            await partidosFase[i].update({
              fechaHora: new Date(fa.fechas[i])
            });
            totalActualizados++;
          }
        }
      }
      results.acciones['actualizacion_fechas'] = `Actualizadas las fechas de ${totalActualizados} partidos de eliminatorias existentes.`;
    }

    // Corregir y re-calcular automáticamente los cruces de 16vos con la lógica del simulador
    try {
      const { cerrarFaseGrupos } = await import('../services/torneo.service');
      await cerrarFaseGrupos();
      results.acciones['cierre_fase_grupos'] = 'Re-calculados y actualizados los cruces de 16vos de final en la base de datos según la matriz de la FIFA.';
    } catch (err: any) {
      results.acciones['cierre_fase_grupos'] = `No se pudieron actualizar los cruces de 16vos: ${err.message}`;
    }

    res.json({ 
      mensaje: 'Proceso de reparación y diagnóstico completado', 
      db: sequelize.getDatabaseName(),
      detalles: results 
    });
  } catch (error: any) {
    console.error('Error en db-fix:', error);
    res.status(500).json({ error: error.message });
  }
});

router.use(authenticate, requireAdmin);

router.post('/test-push-global', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { SuscripcionPush } = await import('../models/SuscripcionPush');
    const { Usuario } = await import('../models/Usuario');
    const webpush = (await import('web-push')).default;

    // Configurar web-push de manera segura
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      try {
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT || 'mailto:admin@prode.com',
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
      } catch (vapidErr) {
        // Ignorar si ya está configurado
      }
    } else {
      res.status(400).json({ error: 'Las claves VAPID no están configuradas en el servidor.' });
      return;
    }

    // Buscar todas las suscripciones push de usuarios activos
    const suscripciones = await SuscripcionPush.findAll({
      include: [{
        model: Usuario,
        as: 'usuario',
        where: { activo: true }
      }]
    });

    if (suscripciones.length === 0) {
      res.status(404).json({ error: 'No hay ninguna suscripción push activa registrada en el sistema.' });
      return;
    }

    const { titulo, mensaje } = req.body || {};
    const finalTitle = titulo || '🏆 Alerta Global Prode 2026';
    const finalBody = mensaje || 'Esta es una notificación de prueba global enviada por el administrador del sistema.';

    let enviados = 0;
    let fallidos = 0;

    for (const sub of suscripciones) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const payload = JSON.stringify({
          title: finalTitle,
          body: finalBody,
          icon: '/assets/icon-192x192.png',
          data: { url: '/dashboard' },
        });

        await webpush.sendNotification(pushSubscription, payload);
        enviados++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[ADMIN-PUSH] Eliminando suscripción push inválida/expirada ID: ${sub.id}`);
          await sub.destroy();
        } else {
          console.error(`[ADMIN-PUSH] Error al enviar a suscripción ID ${sub.id}:`, err);
        }
        fallidos++;
      }
    }

    res.json({ mensaje: `Notificación de prueba global enviada a ${enviados} dispositivo(s). Errores/limpiezas: ${fallidos}.` });
  } catch (error: any) {
    console.error('Error al enviar test de notificaciones global:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

router.get('/stats', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsuarios = await Usuario.count();
    const usuariosActivos = await Usuario.count({ where: { activo: true } });
    const totalPronosticos = await Pronostico.count();
    const totalPartidos = await Partido.count();
    const partidosFinalizados = await Partido.count({ where: { estado: 'finalizado' } });

    // 1. Usuarios Dormidos (Activos que no tienen ningún pronóstico)
    const usuariosConPronosticos = await Pronostico.findAll({
      attributes: [[fn('DISTINCT', col('usuario_id')), 'usuario_id']],
      raw: true
    });
    const idsConProno = usuariosConPronosticos.map((p: any) => p.usuario_id);
    
    const dormidos = await Usuario.findAll({
      where: {
        id: { [Op.notIn]: idsConProno.length > 0 ? idsConProno : [-1] },
        activo: true,
        rol: 'user'
      },
      attributes: ['id', 'nombre', 'email'],
      limit: 10
    });

    // 2. Tasa de Cobertura de la Fase Actual
    const partidosPendientes = await Partido.findAll({ where: { estado: 'pendiente' } });
    const countPendientes = partidosPendientes.length;
    const pronosticosPosibles = usuariosActivos * countPendientes;
    
    const pronosticosPendientesActuales = await Pronostico.count({
      include: [{
        model: Partido,
        as: 'partido',
        where: { estado: 'pendiente' }
      }]
    });

    const tasaCobertura = pronosticosPosibles > 0 
      ? Math.round((pronosticosPendientesActuales / pronosticosPosibles) * 100) 
      : 0;

    // 3. Top Pronosticadores (Certeros)
    const configExacto = await ConfiguracionPuntos.findOne({ where: { tipo: 'exacto', activo: true } });
    const valorExacto = configExacto?.puntos || 3;

    const counts = await Pronostico.findAll({
      where: { puntosObtenidos: valorExacto },
      attributes: [
        'usuarioId',
        [fn('COUNT', col('id')), 'cantidad']
      ],
      group: ['usuarioId'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 5,
      raw: true
    });

    const topCerteros = await Promise.all(counts.map(async (item: any) => {
      const u = await Usuario.findByPk(item.usuarioId, { attributes: ['nombre', 'email', 'avatarSeed'] });
      return {
        id: item.usuarioId,
        nombre: u?.nombre || 'Desconocido',
        email: u?.email || '',
        avatarSeed: u?.avatarSeed || null,
        aciertos: parseInt(item.cantidad, 10)
      };
    }));

    const { SuscripcionPush } = await import('../models/SuscripcionPush');
    const usuariosConPush = await SuscripcionPush.count({
      distinct: true,
      col: 'usuarioId'
    });

    res.json({
      totalUsuarios,
      usuariosActivos,
      totalPronosticos,
      totalPartidos,
      partidosFinalizados,
      partidosPendientes: totalPartidos - partidosFinalizados,
      tasaCobertura,
      usuariosDormidos: dormidos,
      topCerteros,
      usuariosConPush
    });
  } catch (error) {
    console.error('Error al obtener estadisticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/stats/insights', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Tendencias (El Oráculo) - Consultas separadas para evitar errores de JOIN en GROUP BY
    
    // Favorito
    const partidoFinal = await Partido.findOne({ where: { fase: 'final' } });
    let favorito = 'Sin definir';
    if (partidoFinal) {
      const prons = await Pronostico.findAll({ 
        where: { partidoId: partidoFinal.id },
        attributes: ['golesLocal', 'golesVisitante'],
        raw: true 
      });
      let localGana = 0;
      let visitGana = 0;
      prons.forEach(p => {
        if (p.golesLocal > p.golesVisitante) localGana++;
        else if (p.golesVisitante > p.golesLocal) visitGana++;
      });
      if (localGana + visitGana > 0) {
        favorito = localGana >= visitGana ? partidoFinal.equipoLocal : partidoFinal.equipoVisitante;
      }
    }

    // Marcador más común
    const marcadores = await Pronostico.findAll({
      attributes: [
        'golesLocal', 
        'golesVisitante',
        [fn('COUNT', col('id')), 'cantidad']
      ],
      group: ['golesLocal', 'golesVisitante'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 1,
      raw: true
    }) as any;
    const marcadorComun = marcadores[0] ? `${marcadores[0].golesLocal}-${marcadores[0].golesVisitante}` : 'N/A';

    // Partido más empatado (ID con más pronósticos de empate)
    const empates = await Pronostico.findAll({
      where: sequelize.literal('goles_local = goles_visitante'),
      attributes: ['partidoId', [fn('COUNT', col('id')), 'cantidad']],
      group: ['partidoId'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 1,
      raw: true
    }) as any;
    
    let partidoMasEmpatado = 'N/A';
    if (empates[0]) {
      const part = await Partido.findByPk(empates[0].partidoId);
      if (part) partidoMasEmpatado = `${part.equipoLocal} vs ${part.equipoVisitante}`;
    }

    // 2. Rendimiento
    const usuariosActivos = await Usuario.count({ where: { activo: true, rol: 'user' } });
    const puntosTotales = await Pronostico.sum('puntosObtenidos') || 0;
    const promedioPuntos = usuariosActivos > 0 ? (puntosTotales / usuariosActivos).toFixed(1) : 0;

    const configExacto = await ConfiguracionPuntos.findOne({ where: { tipo: 'exacto', activo: true } });
    const valorExacto = configExacto?.puntos || 3;

    const efecRaw = await Pronostico.findAll({
      attributes: ['usuarioId', [fn('COUNT', col('id')), 'total'], [fn('SUM', sequelize.literal(`CASE WHEN puntos_obtenidos = ${valorExacto} THEN 1 ELSE 0 END`)), 'exactos']],
      group: ['usuarioId'],
      raw: true
    }) as any;

    let mejorEfec = { nombre: 'N/A', porcentaje: 0 };
    for (const row of efecRaw) {
      const porc = Math.round((parseInt(row.exactos) / parseInt(row.total)) * 100);
      if (porc > mejorEfec.porcentaje) {
        const u = await Usuario.findByPk(row.usuarioId);
        mejorEfec = { nombre: u?.nombre || 'N/A', porcentaje: porc };
      }
    }

    // 3. Seguridad
    const connections = await Usuario.count({
      where: { ultimoAcceso: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
    });
    const roles = {
      admin: await Usuario.count({ where: { rol: 'admin' } }),
      user: await Usuario.count({ where: { rol: 'user' } })
    };

    // 4. Datos para Compartir (ShareStats)
    const todosPronosticos = await Pronostico.findAll({ raw: true }) as any[];
    const allUsers = await Usuario.findAll({ where: { activo: true, rol: 'user' }, raw: true }) as any[];
    
    let globalCerteros = 0;
    let globalParciales = 0;
    
    const userStatsMap: Record<number, any> = {};
    allUsers.forEach(u => {
      userStatsMap[u.id] = { id: u.id, nombre: u.nombre, avatarSeed: u.avatarSeed, puntos: 0, certeros: 0, parciales: 0, total: 0 };
    });

    todosPronosticos.forEach(p => {
      const pts = p.puntosObtenidos || 0;
      if (userStatsMap[p.usuarioId]) {
        userStatsMap[p.usuarioId].total++;
        userStatsMap[p.usuarioId].puntos += pts;
        if (pts === valorExacto) {
          userStatsMap[p.usuarioId].certeros++;
          globalCerteros++;
        } else if (pts > 0) {
          userStatsMap[p.usuarioId].parciales++;
          globalParciales++;
        }
      }
    });

    const ranking = Object.values(userStatsMap).sort((a: any, b: any) => b.puntos - a.puntos);
    const top3Share = ranking.slice(0, 3);

    res.json({
      oraculo: { favorito, partidoMasEmpatado, marcadorComun },
      calidad: { promedioPuntos, mejorEfectividad: mejorEfec },
      seguridad: { conexionesHoy: connections, roles },
      shareData: {
        top3: top3Share,
        global: {
          certeros: globalCerteros,
          parciales: globalParciales,
          total: todosPronosticos.length
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener insights:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/stats/share', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { partidoIds } = req.body;
    let whereClause = {};
    if (partidoIds && Array.isArray(partidoIds) && partidoIds.length > 0) {
      whereClause = { partidoId: { [Op.in]: partidoIds } };
    }

    const configExacto = await ConfiguracionPuntos.findOne({ where: { tipo: 'exacto', activo: true } });
    const valorExacto = configExacto?.puntos || 3;

    const pronosticosFiltrados = await Pronostico.findAll({ where: whereClause, raw: true }) as any[];
    const allUsers = await Usuario.findAll({ where: { activo: true, rol: 'user' }, raw: true }) as any[];
    
    let globalCerteros = 0;
    let globalParciales = 0;
    
    const userStatsMap: Record<number, any> = {};
    allUsers.forEach(u => {
      userStatsMap[u.id] = { id: u.id, nombre: u.nombre, avatarSeed: u.avatarSeed, puntos: 0, certeros: 0, parciales: 0, total: 0 };
    });

    pronosticosFiltrados.forEach(p => {
      const pts = p.puntosObtenidos || 0;
      if (userStatsMap[p.usuarioId]) {
        userStatsMap[p.usuarioId].total++;
        userStatsMap[p.usuarioId].puntos += pts;
        if (pts === valorExacto) {
          userStatsMap[p.usuarioId].certeros++;
          globalCerteros++;
        } else if (pts > 0) {
          userStatsMap[p.usuarioId].parciales++;
          globalParciales++;
        }
      }
    });

    const ranking = Object.values(userStatsMap).sort((a: any, b: any) => b.puntos - a.puntos);
    const top3Share = ranking.slice(0, 3);

    res.json({
      top3: top3Share,
      global: {
        certeros: globalCerteros,
        parciales: globalParciales,
        total: pronosticosFiltrados.length
      }
    });
  } catch (error) {
    console.error('Error al generar share data:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/pronosticos/:usuarioId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { usuarioId } = req.params;
    
    const pronosticos = await Pronostico.findAll({
      where: { usuarioId },
      include: [{
        model: Partido,
        as: 'partido',
      }],
      order: [
        [{ model: Partido, as: 'partido' }, 'fecha_hora', 'ASC']
      ]
    });

    res.json(pronosticos);
  } catch (error) {
    console.error('Error al obtener pronosticos del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
