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
      { name: 'estado', sql: 'ALTER TABLE "partidos" ADD COLUMN IF NOT EXISTS "estado" VARCHAR(20) DEFAULT \'pendiente\'' }
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
