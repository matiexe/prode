import { Router, Request, Response } from 'express';
import { Pronostico } from '../models/Pronostico';
import { Partido } from '../models/Partido';
import { Usuario } from '../models/Usuario';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { sequelize } from '../config/database';

const router = Router();

router.get('/puntajes', async (_req: Request, res: Response): Promise<void> => {
  try {
    const usuarios = await Usuario.findAll({
      where: { activo: true },
      attributes: ['id', 'nombre'],
      raw: true,
    });

    const pronosticoStats = await Pronostico.findAll({
      attributes: [
        'usuarioId',
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('puntos_obtenidos')), 0), 'puntos'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalPronosticos'],
      ],
      group: [sequelize.col('Pronostico.usuario_id')],
      raw: true,
    });

    const statsMap = new Map<number, any>();
    for (const stat of pronosticoStats as any[]) {
      statsMap.set(stat.usuarioId, stat);
    }

    const resultado = (usuarios as any[])
      .map((u: any) => {
        const stats = statsMap.get(u.id);
        return {
          usuarioId: u.id,
          nombre: u.nombre,
          puntos: stats ? parseInt(stats.puntos, 10) || 0 : 0,
          pronosticos: stats ? parseInt(stats.totalPronosticos, 10) || 0 : 0,
        };
      })
      .sort((a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre))
      .map((entry, index) => ({
        posicion: index + 1,
        ...entry,
      }));

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.use(authenticate);

router.get('/mis', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pronosticos = await Pronostico.findAll({
      where: { usuarioId: req.usuario!.id },
      order: [['id', 'ASC']],
    });

    res.json(pronosticos);
  } catch (error) {
    console.error('Error al obtener pronosticos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { partidoId, golesLocal, golesVisitante } = req.body;

    if (!partidoId || golesLocal === undefined || golesVisitante === undefined) {
      res.status(400).json({ error: 'partidoId, golesLocal y golesVisitante son requeridos' });
      return;
    }

    const partidoRow = await Partido.findByPk(partidoId);
    if (!partidoRow) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    const partido = partidoRow.get({ plain: true });
    if (partido.estado !== 'pendiente') {
      res.status(403).json({ error: 'El partido ya comenzo o finalizo. No se puede modificar el pronostico.' });
      return;
    }

    if (new Date() > new Date(partido.fechaHora)) {
      res.status(403).json({ error: 'El partido ya comenzo. No se puede modificar el pronostico.' });
      return;
    }

    const [pronostico, created] = await Pronostico.findOrCreate({
      where: { usuarioId: req.usuario!.id, partidoId },
      defaults: { usuarioId: req.usuario!.id, partidoId, golesLocal, golesVisitante },
    });
    if (!created) {
      await pronostico.update({ golesLocal, golesVisitante });
    }

    const data = pronostico.get({ plain: true });
    res.json(data);
  } catch (error) {
    console.error('Error al guardar pronostico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
