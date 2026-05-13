import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { Usuario } from '../models/Usuario';
import { CodigoOTP } from '../models/CodigoOTP';
import { sendOTP } from '../services/mailer';

const router = Router();

router.post('/solicitar-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'El email es requerido' });
      return;
    }

    const totalUsers = await Usuario.count();
    const allUsers = await Usuario.findAll({ attributes: ['email', 'activo'] });
    console.log(`[DEBUG] Intentando buscar email: "${email}". Usuarios totales en DB: ${totalUsers}`);
    console.log(`[DEBUG] Usuarios existentes: ${JSON.stringify(allUsers)}`);

    // Búsqueda insensible a mayúsculas/minúsculas para Postgres
    const usuario = await Usuario.findOne({ 
      where: { 
        email: { [Op.iLike]: email.trim() }, 
        activo: true 
      } 
    });

    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado. Contacta al administrador.' });
      return;
    }

    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiraEn = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10) * 60 * 1000));

    await CodigoOTP.create({ email, codigo, expiraEn });

    await sendOTP(email, codigo);

    res.json({ mensaje: 'Codigo enviado al email', email: usuario.email });
  } catch (error) {
    console.error('Error al solicitar OTP:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/verificar-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, codigo } = req.body;

    if (!email || !codigo) {
      res.status(400).json({ error: 'Email y codigo son requeridos' });
      return;
    }

    const otp = await CodigoOTP.findOne({
      where: { email, codigo, usado: false },
      order: [['createdAt', 'DESC']],
    });

    if (!otp) {
      res.status(401).json({ error: 'Codigo invalido' });
      return;
    }

    if (new Date() > otp.expiraEn) {
      res.status(401).json({ error: 'Codigo expirado. Solicita uno nuevo.' });
      return;
    }

    await otp.update({ usado: true });

    const usuario = await Usuario.findOne({ where: { email, activo: true } });
    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const userData = usuario.get({ plain: true });
    console.log('[AUTH] Usuario encontrado:', JSON.stringify(userData));

    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { usuarioId: userData.id, rol: userData.rol },
      secret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    );

    res.json({
      token,
      usuario: {
        id: userData.id,
        nombre: userData.nombre,
        email: userData.email,
        rol: userData.rol,
      },
    });
  } catch (error) {
    console.error('Error al verificar OTP:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
