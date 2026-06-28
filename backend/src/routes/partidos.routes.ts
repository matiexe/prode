import { Router, Request, Response } from 'express';
import { Partido } from '../models/Partido';
import { authenticate, requireAdmin, AuthRequest } from '../middlewares/auth.middleware';
import { FIXTURE_DATA } from '../data/fixture';

export const partidosRouter = Router();
export const partidosAdminRouter = Router();

partidosAdminRouter.use(authenticate, requireAdmin);

partidosRouter.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { fase, grupo } = req.query;
    const where: any = {};

    if (fase) where.fase = fase;
    if (grupo) where.grupo = grupo;

    const partidos = await Partido.findAll({
      where,
      order: [['fechaHora', 'ASC']],
    });

    res.json(partidos);
  } catch (error) {
    console.error('Error al listar partidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

partidosAdminRouter.post('/generar', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('[FIXTURE] Iniciando generación de fixture (Versión: bulkCreate-v3)...');
    const existingCount = await Partido.count();
    if (existingCount > 0) {
      res.status(409).json({ error: 'El fixture ya fue generado. Elimina los partidos existentes primero.' });
      return;
    }

    const partidosToCreate: any[] = [];

    // 1. Preparar partidos de grupos
    for (const [grupo, data] of Object.entries(FIXTURE_DATA.grupos)) {
      for (const partido of data.partidos) {
        partidosToCreate.push({
          fase: 'grupos',
          grupo,
          equipoLocal: partido.local,
          equipoVisitante: partido.visitante,
          fechaHora: new Date(partido.fecha),
          estado: 'pendiente'
        });
      }
    }

    // 2. Preparar partidos de eliminatorias
    const fechas16vos = [
      '2026-06-28T19:00:00Z', // P73
      '2026-06-29T17:00:00Z', // P74
      '2026-06-29T19:00:00Z', // P75
      '2026-06-29T21:00:00Z', // P76
      '2026-06-30T17:00:00Z', // P77
      '2026-06-30T19:00:00Z', // P78
      '2026-06-30T21:00:00Z', // P79
      '2026-07-01T17:00:00Z', // P80
      '2026-07-01T19:00:00Z', // P81
      '2026-07-01T21:00:00Z', // P82
      '2026-07-02T17:00:00Z', // P83
      '2026-07-02T19:00:00Z', // P84
      '2026-07-02T21:00:00Z', // P85
      '2026-07-03T17:00:00Z', // P86
      '2026-07-03T19:00:00Z', // P87
      '2026-07-03T21:00:00Z', // P88
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

    const eliminatorias: Array<{ fase: '16vos' | '8vos' | 'cuartos' | 'semis' | '3er_puesto' | 'final'; fechas: string[] }> = [
      { fase: '16vos', fechas: fechas16vos },
      { fase: '8vos', fechas: fechas8vos },
      { fase: 'cuartos', fechas: fechasCuartos },
      { fase: 'semis', fechas: fechasSemis },
      { fase: '3er_puesto', fechas: fechas3erPuesto },
      { fase: 'final', fechas: fechasFinal },
    ];

    for (const { fase, fechas } of eliminatorias) {
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

    // 3. Inserción masiva (mucho más rápido en producción)
    await Partido.bulkCreate(partidosToCreate);

    res.status(201).json({
      mensaje: `Fixture generado exitosamente`,
      totalPartidos: partidosToCreate.length,
    });
  } catch (error) {
    console.error('Error al generar fixture:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

function generarFechas(inicio: string, fin: string, cantidad: number): string[] {
  const start = new Date(inicio);
  const end = new Date(fin);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const fechas: string[] = [];
  for (let i = 0; i < cantidad; i++) {
    const d = new Date(start);
    const offset = diffDays === 0 ? 0 : (i * diffDays) / Math.max(cantidad - 1, 1);
    d.setDate(d.getDate() + offset);
    d.setUTCHours(i % 2 === 0 ? 17 : 21, 0, 0, 0);
    fechas.push(d.toISOString());
  }
  return fechas;
}

partidosAdminRouter.delete('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await Partido.count();
    if (count === 0) {
      res.status(404).json({ error: 'No hay fixture para eliminar.' });
      return;
    }

    const { Pronostico } = await import('../models/Pronostico');
    await Pronostico.destroy({ where: {} });
    await Partido.destroy({ where: {} });

    res.json({ mensaje: `Fixture eliminado: ${count} partidos y sus pronosticos.` });
  } catch (error) {
    console.error('Error al eliminar fixture:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

partidosAdminRouter.put('/:id/resultado', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { golesLocal, golesVisitante, ganadorNombre } = req.body;

    if (golesLocal === undefined || golesVisitante === undefined) {
      res.status(400).json({ error: 'Goles local y visitante son requeridos' });
      return;
    }

    const partido = await Partido.findByPk(id);
    if (!partido) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    // Si es fase eliminatoria y hay empate, el ganadorNombre es obligatorio
    if (partido.fase !== 'grupos' && golesLocal === golesVisitante && !ganadorNombre) {
      res.status(400).json({ error: 'En fases eliminatorias, si hay empate se debe especificar un ganador (penales)' });
      return;
    }

    // Determinar ganador automático si no hay empate
    let finalGanador = ganadorNombre;
    if (golesLocal > golesVisitante) finalGanador = partido.equipoLocal;
    if (golesVisitante > golesLocal) finalGanador = partido.equipoVisitante;

    await partido.update({
      golesLocal,
      golesVisitante,
      ganadorNombre: finalGanador,
      estado: 'finalizado',
    });

    const { calcularPuntosPronosticos } = await import('../services/puntuacion.service');
    await calcularPuntosPronosticos(Number(id));

    res.json({ mensaje: 'Resultado guardado y puntos calculados', partido });
  } catch (error) {
    console.error('Error al cargar resultado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

partidosAdminRouter.post('/:id/recalcular', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const partido = await Partido.findByPk(id);
    if (!partido) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    if (partido.estado !== 'finalizado') {
      res.status(400).json({ error: 'El partido no se encuentra finalizado. Debe cargarse un resultado primero.' });
      return;
    }

    const { calcularPuntosPronosticos } = await import('../services/puntuacion.service');
    await calcularPuntosPronosticos(Number(id));

    res.json({ mensaje: 'Puntos de pronósticos recalculados correctamente para el partido', partido });
  } catch (error) {
    console.error('Error al recalcular puntos del partido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


partidosAdminRouter.post('/cerrar-fase', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fase } = req.body;
    if (!fase) {
      res.status(400).json({ error: 'La fase es requerida' });
      return;
    }

    const { cerrarFaseEliminatoria, cerrarFaseGrupos } = await import('../services/torneo.service');
    
    if (fase === 'grupos') {
      await cerrarFaseGrupos();
    } else {
      await cerrarFaseEliminatoria(fase);
    }

    res.json({ mensaje: `Fase ${fase} cerrada y equipos avanzados exitosamente.` });
  } catch (error: any) {
    console.error(`Error al cerrar fase ${req.body.fase}:`, error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

partidosRouter.all('/cron-resultados', async (req: Request, res: Response): Promise<void> => {
  try {
    const headers = req.headers;
    const isVercelCron = headers['x-vercel-cron'] === '1' || !!headers['x-vercel-cron-schedule'];
    const userAgent = headers['user-agent'];
    const authHeader = headers['authorization'];

    const secret = req.body?.secret || req.query.secret || headers['x-admin-secret'];
    
    if (!isVercelCron && (!secret || secret !== process.env.ADMIN_SECRET)) {
      console.warn('[CRON-RESULTADOS] Acceso denegado. No es Vercel Cron y no se proveyó ADMIN_SECRET válido.');
      res.status(401).json({ 
        error: 'No autorizado. Se requiere firma de Vercel Cron o ADMIN_SECRET correcto.' 
      });
      return;
    }

    console.log('[CRON-RESULTADOS] Iniciando sincronización de marcadores desde API-Football...');
    const { sincronizarResultadosEnVivo } = await import('../services/apiFootball.service');
    const result = await sincronizarResultadosEnVivo();
    
    res.json({
      mensaje: 'Sincronización de resultados en vivo completada.',
      result
    });
  } catch (error: any) {
    console.error('[CRON-RESULTADOS] Error en cron de resultados:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

