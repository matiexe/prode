import apiClient from './client';

export interface VapidKeyResponse {
  publicKey: string;
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export async function getVapidPublicKey(): Promise<string> {
  const { data } = await apiClient.get<VapidKeyResponse>('/notificaciones/vapid-public-key');
  return data.publicKey;
}

export async function suscribirPush(subscription: PushSubscription): Promise<any> {
  // Convertir el objeto PushSubscription en formato compatible con JSON
  const subJSON = subscription.toJSON();
  const payload: PushSubscriptionPayload = {
    endpoint: subJSON.endpoint || '',
    keys: {
      p256dh: subJSON.keys?.p256dh || '',
      auth: subJSON.keys?.auth || '',
    },
  };
  const { data } = await apiClient.post('/notificaciones/suscribirse', payload);
  return data;
}

export async function desuscribirPush(endpoint: string): Promise<any> {
  const { data } = await apiClient.post('/notificaciones/desuscribirse', { endpoint });
  return data;
}

export async function enviarNotificacionTest(): Promise<any> {
  const { data } = await apiClient.post('/notificaciones/test');
  return data;
}
