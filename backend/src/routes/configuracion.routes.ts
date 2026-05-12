import { Router, Response } from 'express';
import { ConfiguracionPuntos } from '../models/ConfiguracionPuntos';
import { authenticate, requireAdmin, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await ConfiguracionPuntos.findAll({ where: { activo: true } });
    const result: Record<string, number> = {};
    for (const item of config) {
      result[item.tipo] = item.puntos;
    }
    res.json(result);
  } catch (error) {
    console.error('Error al obtener configuracion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { exacto, diferencia, ganador, error } = req.body;

    const updates: Array<{ tipo: string; puntos: number }> = [];
    if (exacto !== undefined) updates.push({ tipo: 'exacto', puntos: exacto });
    if (diferencia !== undefined) updates.push({ tipo: 'diferencia', puntos: diferencia });
    if (ganador !== undefined) updates.push({ tipo: 'ganador', puntos: ganador });
    if (error !== undefined) updates.push({ tipo: 'error', puntos: error });

    for (const update of updates) {
      await ConfiguracionPuntos.update(
        { puntos: update.puntos },
        { where: { tipo: update.tipo } }
      );
    }

    const config = await ConfiguracionPuntos.findAll({ where: { activo: true } });
    const result: Record<string, number> = {};
    for (const item of config) {
      result[item.tipo] = item.puntos;
    }

    res.json(result);
  } catch (error) {
    console.error('Error al actualizar configuracion:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
