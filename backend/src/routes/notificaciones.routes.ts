import { Router, Response } from 'express';
import { SuscripcionPush } from '../models/SuscripcionPush';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import webpush from 'web-push';

// Configurar web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@prode.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

const router = Router();

// Endpoint del Cron Job (público pero protegido por ADMIN_SECRET)
router.post('/cron-pendientes', async (req, res): Promise<void> => {
  try {
    const { secret } = req.body;
    const token = secret || req.query.secret || req.headers['x-admin-secret'];
    
    if (!token || token !== process.env.ADMIN_SECRET) {
      res.status(401).json({ error: 'No autorizado. Secret incorrecto.' });
      return;
    }

    const { notificarPronosticosPendientes } = await import('../services/notificaciones-cron.service');
    await notificarPronosticosPendientes();

    res.json({ mensaje: 'Notificaciones de pronósticos pendientes procesadas correctamente.' });
  } catch (error: any) {
    console.error('Error en cron de notificaciones:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

router.use(authenticate);


// 1. Obtener la clave pública VAPID
router.get('/vapid-public-key', (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

// 2. Registrar una nueva suscripción push
router.post('/suscribirse', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: 'Datos de suscripción push incompletos' });
      return;
    }

    const [suscripcion, created] = await SuscripcionPush.findOrCreate({
      where: { endpoint },
      defaults: {
        usuarioId: req.usuario!.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    if (!created) {
      await suscripcion.update({
        usuarioId: req.usuario!.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
    }

    res.status(201).json({ mensaje: 'Suscripción registrada con éxito', suscripcion });
  } catch (error: any) {
    console.error('Error al registrar suscripción push:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// 3. Desactivar o desuscribirse
router.post('/desuscribirse', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint es requerido' });
      return;
    }

    const deleted = await SuscripcionPush.destroy({
      where: {
        usuarioId: req.usuario!.id,
        endpoint,
      },
    });

    res.json({ mensaje: deleted > 0 ? 'Suscripción eliminada' : 'No se encontró la suscripción' });
  } catch (error: any) {
    console.error('Error al eliminar suscripción push:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// 4. Enviar una notificación de prueba para desarrollo/diagnóstico
router.post('/test', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const suscripciones = await SuscripcionPush.findAll({ where: { usuarioId: req.usuario!.id } });
    if (suscripciones.length === 0) {
      res.status(404).json({ error: 'No tienes ninguna suscripción de notificaciones push registrada en este navegador/dispositivo.' });
      return;
    }

    let enviados = 0;
    for (const sub of suscripciones) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const payload = JSON.stringify({
          title: '🏆 Prode Mundial 2026',
          body: '¡Esta es una notificación de prueba! Tu configuración de Web Push funciona correctamente.',
          icon: '/assets/icon-192x192.png',
          data: { url: '/dashboard' },
        });

        await webpush.sendNotification(pushSubscription, payload);
        enviados++;
      } catch (err: any) {
        // Si el endpoint de suscripción ya expiró (por ejemplo, el usuario borró cookies/permisos):
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Eliminando suscripción push inválida/expirada ID: ${sub.id}`);
          await sub.destroy();
        } else {
          console.error(`Error al enviar a la suscripción ID ${sub.id}:`, err);
        }
      }
    }

    res.json({ mensaje: `Notificación de prueba enviada a ${enviados} dispositivo(s).` });
  } catch (error: any) {
    console.error('Error al enviar notificación de prueba:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

export default router;
