import { Router, Response } from 'express';
import { Usuario } from '../models/Usuario';
import { authenticate, requireAdmin, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nombre', 'email', 'rol', 'activo', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nombre, email, rol } = req.body;

    if (!nombre || !email) {
      res.status(400).json({ error: 'Nombre y email son requeridos' });
      return;
    }

    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      res.status(409).json({ error: 'El email ya esta registrado' });
      return;
    }

    const usuario = await Usuario.create({
      nombre,
      email,
      rol: rol || 'user',
    });

    res.status(201).json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo,
      createdAt: usuario.createdAt,
    });
  } catch (error: any) {
    if (error?.name === 'SequelizeValidationError') {
      res.status(400).json({ error: error.errors?.map((e: any) => e.message).join(', ') });
      return;
    }
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, activo } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    await usuario.update({
      ...(nombre && { nombre }),
      ...(email && { email }),
      ...(rol && { rol }),
      ...(activo !== undefined && { activo }),
    });

    res.json(usuario);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    await usuario.update({ activo: false });
    res.json({ mensaje: 'Usuario desactivado correctamente' });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
