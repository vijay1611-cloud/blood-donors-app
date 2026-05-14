import sgMail from '@sendgrid/mail';
import { NotificationProvider, NotificationRecipient, NotificationMessage, SendResult } from './types';

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error('SENDGRID_API_KEY is not set');
  sgMail.setApiKey(key);
  initialized = true;
}

export const sendgridProvider: NotificationProvider = {
  channel: 'email',
  async send(to: NotificationRecipient, message: NotificationMessage): Promise<SendResult> {
    ensureInitialized();
    const from = process.env.EMAIL_FROM;
    if (!from) return { ok: false, error: 'EMAIL_FROM is not set' };
    if (!to.email) return { ok: false, error: 'recipient has no email' };

    try {
      await sgMail.send({
        to: to.email,
        from,
        subject: message.subject,
        text: message.textBody,
        html: message.htmlBody,
      });
      return { ok: true };
    } catch (err: any) {
      const detail = err?.response?.body?.errors?.[0]?.message || err?.message || 'send failed';
      return { ok: false, error: detail };
    }
  },
};

export function emailProviderEnabled(): boolean {
  return !!process.env.SENDGRID_API_KEY && !!process.env.EMAIL_FROM;
}
