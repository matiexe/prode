import webpush from 'web-push';
import { Op } from 'sequelize';
import { Usuario } from '../models/Usuario';
import { Partido } from '../models/Partido';
import { Pronostico } from '../models/Pronostico';
import { SuscripcionPush } from '../models/SuscripcionPush';

// Configurar web-push de manera segura (evita caídas si no están las variables)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@prode.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch (error) {
    console.error('Error al configurar web-push (VAPID):', error);
  }
} else {
  console.warn('VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY no configurados. Las notificaciones push no funcionarán.');
}

export async function notificarPronosticosPendientes(): Promise<void> {
  console.log('[CRON-PUSH] Iniciando chequeo de pronósticos pendientes...');
  
  // 1. Obtener partidos pendientes que comiencen en las próximas 24 horas
  const ahora = new Date();
  const limite24hs = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

  const proximosPartidos = await Partido.findAll({
    where: {
      estado: 'pendiente',
      fechaHora: {
        [Op.between]: [ahora, limite24hs],
      },
    },
  });

  if (proximosPartidos.length === 0) {
    console.log('[CRON-PUSH] No hay partidos pendientes en las próximas 24 horas.');
    return;
  }

  console.log(`[CRON-PUSH] Se encontraron ${proximosPartidos.length} partidos próximos.`);

  // 2. Obtener todos los usuarios normales activos
  const usuarios = await Usuario.findAll({
    where: {
      activo: true,
      rol: 'user',
    },
  });

  let notificacionesEnviadas = 0;

  for (const usuario of usuarios) {
    // 3. Obtener cuántos pronósticos tiene el usuario para estos partidos
    const pronosticosRealizados = await Pronostico.findAll({
      where: {
        usuarioId: usuario.id,
        partidoId: {
          [Op.in]: proximosPartidos.map(p => p.id),
        },
      },
    });

    const cantidadPendientes = proximosPartidos.length - pronosticosRealizados.length;

    // 4. Si tiene partidos pendientes, buscar sus suscripciones push
    if (cantidadPendientes > 0) {
      const suscripciones = await SuscripcionPush.findAll({
        where: { usuarioId: usuario.id },
      });

      if (suscripciones.length === 0) continue;

      console.log(`[CRON-PUSH] Usuario ${usuario.nombre} tiene ${cantidadPendientes} partidos pendientes. Enviando push a ${suscripciones.length} dispositivo(s)...`);

      const payload = JSON.stringify({
        title: '🏆 Prode Mundial 2026',
        body: `¡Tienes ${cantidadPendientes} partido(s) pendiente(s) por pronosticar para las próximas 24hs! No te quedes sin sumar puntos.`,
        icon: '/assets/icon-192x192.png',
        data: { url: '/dashboard' },
      });

      for (const sub of suscripciones) {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        webpush.sendNotification(pushSubscription, payload).catch(async (err: any) => {
          // Si el endpoint ya no existe o fue deshabilitado por el usuario, eliminarlo
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[CRON-PUSH] Suscripción expirada detectada. Eliminando ID ${sub.id}`);
            await sub.destroy();
          } else {
            console.error(`[CRON-PUSH] Error enviando a suscripción ${sub.id}:`, err);
          }
        });
      }
      
      notificacionesEnviadas++;
    }
  }

  console.log(`[CRON-PUSH] Proceso terminado. Se enviaron alertas a ${notificacionesEnviadas} usuario(s).`);
}
