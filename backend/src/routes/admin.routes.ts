import { Router, Response } from 'express';
import { Op, fn, col } from 'sequelize';
import { Usuario } from '../models/Usuario';
import { Partido } from '../models/Partido';
import { Pronostico } from '../models/Pronostico';
import { ConfiguracionPuntos } from '../models/ConfiguracionPuntos';
import { authenticate, requireAdmin, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, requireAdmin);

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

    // Nota: PostgreSQL requiere que todas las columnas seleccionadas estén en GROUP BY o agregadas.
    // Simplificamos la consulta para evitar errores de dialecto.
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

    // Hidratamos los datos de los usuarios ganadores
    const topCerteros = await Promise.all(counts.map(async (item: any) => {
      const u = await Usuario.findByPk(item.usuarioId, { attributes: ['nombre', 'email'] });
      return {
        id: item.usuarioId,
        nombre: u?.nombre || 'Desconocido',
        email: u?.email || '',
        aciertos: parseInt(item.cantidad, 10)
      };
    }));

    res.json({
      totalUsuarios,
      usuariosActivos,
      totalPronosticos,
      totalPartidos,
      partidosFinalizados,
      partidosPendientes: totalPartidos - partidosFinalizados,
      tasaCobertura,
      usuariosDormidos: dormidos,
      topCerteros
    });
  } catch (error) {
    console.error('Error al obtener estadisticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/stats/insights', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Tendencias de Predicción (El Oráculo)
    
    // Favorito del Torneo (basado en la Final)
    const partidoFinal = await Partido.findOne({ where: { fase: 'final' } });
    let favorito = 'Sin definir';
    if (partidoFinal) {
      const counts = await Pronostico.findAll({
        where: { partidoId: partidoFinal.id },
        attributes: [
          [fn('COUNT', col('id')), 'total'],
          [fn('SUM', sequelize.literal('CASE WHEN goles_local > goles_visitante THEN 1 ELSE 0 END')), 'local'],
          [fn('SUM', sequelize.literal('CASE WHEN goles_visitante > goles_local THEN 1 ELSE 0 END')), 'visitante']
        ],
        raw: true
      }) as any;

      if (counts[0] && parseInt(counts[0].total) > 0) {
        favorito = parseInt(counts[0].local) >= parseInt(counts[0].visitante) 
          ? partidoFinal.equipoLocal 
          : partidoFinal.equipoVisitante;
      }
    }

    // Partido con más empates
    const masEmpatesRaw = await Pronostico.findAll({
      where: sequelize.literal('goles_local = goles_visitante'),
      attributes: [
        'partidoId',
        [fn('COUNT', col('id')), 'cantidad']
      ],
      group: ['partidoId'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 1,
      include: [{ model: Partido, as: 'partido', attributes: ['equipoLocal', 'equipoVisitante'] }]
    }) as any;

    const partidoMasEmpatado = masEmpatesRaw[0] 
      ? `${masEmpatesRaw[0].partido.equipoLocal} vs ${masEmpatesRaw[0].partido.equipoVisitante}`
      : 'N/A';

    // Marcador más repetido
    const marcadorMasComun = await Pronostico.findAll({
      attributes: [
        [sequelize.literal("CONCAT(goles_local, '-', goles_visitante)"), 'marcador'],
        [fn('COUNT', col('id')), 'cantidad']
      ],
      group: [sequelize.literal("CONCAT(goles_local, '-', goles_visitante)")],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 1,
      raw: true
    }) as any;

    // 2. Rendimiento (Calidad)
    
    // Promedio de puntos
    const usuariosActivos = await Usuario.count({ where: { activo: true, rol: 'user' } });
    const puntosTotales = await Pronostico.sum('puntos_obtenidos') || 0;
    const promedioPuntos = usuariosActivos > 0 ? (puntosTotales / usuariosActivos).toFixed(1) : 0;

    // Mayor efectividad (% Certero)
    // Calculamos: Aciertos Exactos / Pronósticos Totales por usuario
    const configExacto = await ConfiguracionPuntos.findOne({ where: { tipo: 'exacto', activo: true } });
    const valorExacto = configExacto?.puntos || 3;

    const efectividadRaw = await Pronostico.findAll({
      attributes: [
        'usuarioId',
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', sequelize.literal(`CASE WHEN puntos_obtenidos = ${valorExacto} THEN 1 ELSE 0 END`)), 'exactos']
      ],
      group: ['usuarioId'],
      raw: true
    }) as any;

    let mejorEfectividad = { nombre: 'N/A', porcentaje: 0 };
    efectividadRaw.forEach((row: any) => {
      const porcentaje = (parseInt(row.exactos) / parseInt(row.total)) * 100;
      if (porcentaje > mejorEfectividad.porcentaje) {
        mejorEfectividad = { usuarioId: row.usuarioId, porcentaje: Math.round(porcentaje) } as any;
      }
    });

    if ((mejorEfectividad as any).usuarioId) {
      const u = await Usuario.findByPk((mejorEfectividad as any).usuarioId);
       mejorEfectividad.nombre = u?.nombre || 'N/A';
    }

    // 3. Monitoreo Técnico
    
    // Conexiones últimas 24hs
    const ultimas24hs = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const conexionesRecientes = await Usuario.count({
      where: {
        ultimoAcceso: { [Op.gte]: ultimas24hs }
      }
    });

    // Distribución de roles
    const adminCount = await Usuario.count({ where: { rol: 'admin' } });
    const userCount = await Usuario.count({ where: { rol: 'user' } });

    res.json({
      oraculo: {
        favorito,
        partidoMasEmpatado,
        marcadorComun: marcadorMasComun[0]?.marcador || 'N/A'
      },
      calidad: {
        promedioPuntos,
        mejorEfectividad
      },
      seguridad: {
        conexionesHoy: conexionesRecientes,
        roles: { admin: adminCount, user: userCount }
      }
    });
  } catch (error) {
    console.error('Error al obtener insights:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/db-fix', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sequelize } = await import('../config/database');
    console.log('[DB-FIX] Iniciando reparación y diagnóstico de esquema...');
    
    const results: any = {
      acciones: {},
      estado_actual: []
    };
    
    const queries = [
      { name: 'ganador_nombre', sql: 'ALTER TABLE "partidos" ADD COLUMN IF NOT EXISTS "ganador_nombre" VARCHAR(255)' },
      { name: 'goles_local', sql: 'ALTER TABLE "partidos" ADD COLUMN IF NOT EXISTS "goles_local" INTEGER' },
      { name: 'goles_visitante', sql: 'ALTER TABLE "partidos" ADD COLUMN IF NOT EXISTS "goles_visitante" INTEGER' },
      { name: 'estado', sql: 'ALTER TABLE "partidos" ADD COLUMN IF NOT EXISTS "estado" VARCHAR(20) DEFAULT \'pendiente\'' },
      { name: 'ultimo_acceso', sql: 'ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "ultimo_acceso" TIMESTAMP WITH TIME ZONE' }
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

export default router;
