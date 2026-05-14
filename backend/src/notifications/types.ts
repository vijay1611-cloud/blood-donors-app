import { NotificationChannel } from '../models/NotificationLog';

export interface NotificationRecipient {
  uid: string;
  email: string;
}

export interface NotificationMessage {
  subject: string;
  textBody: string;
  htmlBody: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(to: NotificationRecipient, message: NotificationMessage): Promise<SendResult>;
}
