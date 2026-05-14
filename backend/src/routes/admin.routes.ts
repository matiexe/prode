import { Router, Response } from 'express';
import { Usuario } from '../models/Usuario';
import { Partido } from '../models/Partido';
import { Pronostico } from '../models/Pronostico';
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

    res.json({
      totalUsuarios,
      usuariosActivos,
      totalPronosticos,
      totalPartidos,
      partidosFinalizados,
      partidosPendientes: totalPartidos - partidosFinalizados
    });
  } catch (error) {
    console.error('Error al obtener estadisticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
