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
    const existingCount = await Partido.count();
    if (existingCount > 0) {
      res.status(409).json({ error: 'El fixture ya fue generado. Elimina los partidos existentes primero.' });
      return;
    }

    let partidosCreados = 0;

    for (const [grupo, data] of Object.entries(FIXTURE_DATA.grupos)) {
      for (const partido of data.partidos) {
        await Partido.create({
          fase: 'grupos',
          grupo,
          equipoLocal: partido.local,
          equipoVisitante: partido.visitante,
          fechaHora: new Date(partido.fecha),
        });
        partidosCreados++;
      }
    }

    const eliminatorias: Array<{ fase: '16vos' | '8vos' | 'cuartos' | 'semis' | '3er_puesto' | 'final'; partidos: number; fechas: string[] }> = [
      { fase: '16vos', partidos: 16, fechas: generarFechas('2026-06-28', '2026-07-03', 16) },
      { fase: '8vos', partidos: 8, fechas: generarFechas('2026-07-04', '2026-07-07', 8) },
      { fase: 'cuartos', partidos: 4, fechas: generarFechas('2026-07-09', '2026-07-11', 4) },
      { fase: 'semis', partidos: 2, fechas: ['2026-07-14T19:00:00Z', '2026-07-15T19:00:00Z'] },
      { fase: '3er_puesto', partidos: 1, fechas: ['2026-07-18T17:00:00Z'] },
      { fase: 'final', partidos: 1, fechas: ['2026-07-19T18:00:00Z'] },
    ];

    for (const { fase, partidos: cantidad, fechas } of eliminatorias) {
      for (let i = 0; i < cantidad; i++) {
        const fecha = fechas[i] || fechas[fechas.length - 1];
        await Partido.create({
          fase,
          grupo: null,
          equipoLocal: 'Por definir',
          equipoVisitante: 'Por definir',
          fechaHora: new Date(fecha),
        });
        partidosCreados++;
      }
    }

    res.status(201).json({
      mensaje: `Fixture generado exitosamente`,
      totalPartidos: partidosCreados,
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
    const { golesLocal, golesVisitante } = req.body;

    if (golesLocal === undefined || golesVisitante === undefined) {
      res.status(400).json({ error: 'Goles local y visitante son requeridos' });
      return;
    }

    const partido = await Partido.findByPk(id);
    if (!partido) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    await partido.update({
      golesLocal,
      golesVisitante,
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

partidosAdminRouter.post('/cerrar-grupos', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cerrarFaseGrupos } = await import('../services/torneo.service');
    await cerrarFaseGrupos();
    res.json({ mensaje: 'Fase de grupos cerrada y llaves de 16vos generadas exitosamente.' });
  } catch (error: any) {
    console.error('Error al cerrar fase de grupos:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

