import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = process.env.SMTP_FROM || 'onboarding@resend.dev';

export async function sendOTP(email: string, codigo: string): Promise<void> {
  try {
    const { data, error } = await resend.emails.send({
      from: `Prode 2026 <${FROM_ADDRESS}>`,
      to: [email],
      subject: 'Tu codigo de verificacion - Prode Mundial 2026',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #101415; color: #e0e0e0; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px;">🏆</span>
            <h1 style="font-family: sans-serif; color: #00e5ff; margin: 8px 0 0;">PRODE BSC WC2026</h1>
          </div>
          <p style="font-size: 16px; margin-bottom: 24px;">Usa el siguiente codigo para verificar tu cuenta:</p>
          <div style="text-align: center; padding: 20px; background: rgba(0,229,255,0.08); border-radius: 12px; letter-spacing: 8px; font-size: 36px; font-weight: bold; color: #00e5ff; margin-bottom: 24px;">
            ${codigo}
          </div>
          <p style="font-size: 14px; color: #888; margin-bottom: 8px;">Este codigo expira en ${process.env.OTP_EXPIRES_MINUTES || '10'} minutos.</p>
          <p style="font-size: 14px; color: #888;">Si no solicitaste este codigo, ignora este mensaje.</p>
        </div>
      `,
    });

    if (error) {
      console.error('[RESEND ERROR]', error);
      throw new Error('Error al enviar el email');
    }

    console.log(`[RESEND] OTP enviado a ${email}: ${data?.id}`);
  } catch (error) {
    console.error('[MAILER ERROR]', error);
    throw error;
  }
}
