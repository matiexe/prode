import { Router, Request, Response } from 'express';
import { Usuario } from '../models/Usuario';

const router = Router();

router.post('/admin', async (_req: Request, res: Response): Promise<void> => {
  try {
    const existing = await Usuario.findOne({ where: { email: 'admin@prode2026.com' } });
    if (existing) {
      res.status(409).json({
        mensaje: 'El administrador ya existe.',
        email: 'admin@prode2026.com',
      });
      return;
    }

    const admin = await Usuario.create({
      nombre: 'Administrador',
      email: 'admin@prode2026.com',
      rol: 'admin',
    });

    res.status(201).json({
      mensaje: 'Administrador creado exitosamente.',
      usuario: {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        rol: admin.rol,
      },
    });
  } catch (error) {
    console.error('Error al crear admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
