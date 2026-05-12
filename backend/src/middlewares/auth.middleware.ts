import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models/Usuario';

export interface AuthRequest extends Request {
  usuario?: Usuario;
}

interface JwtPayload {
  usuarioId: number;
  rol: 'admin' | 'user';
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token no proporcionado' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    const usuario = await Usuario.findByPk(decoded.usuarioId);
    if (!usuario) {
      res.status(401).json({ error: 'Usuario no encontrado o desactivado' });
      return;
    }

    const userData = usuario.get({ plain: true });
    if (!userData.activo) {
      res.status(401).json({ error: 'Usuario no encontrado o desactivado' });
      return;
    }

    req.usuario = userData as Usuario;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.usuario?.rol !== 'admin') {
    res.status(403).json({ error: 'Acceso no autorizado. Se requiere rol de administrador.' });
    return;
  }
  next();
}
