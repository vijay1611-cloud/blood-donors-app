import { Schema, model, InferSchemaType } from 'mongoose';

export const NOTIFICATION_CHANNELS = ['email'] as const;
export const NOTIFICATION_STATUSES = ['sent', 'failed', 'skipped'] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

const notificationLogSchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'BloodRequest', required: true, index: true },
    donorUid: { type: String, required: true, index: true },
    channel: { type: String, enum: NOTIFICATION_CHANNELS, required: true },
    recipient: { type: String, required: true },
    status: { type: String, enum: NOTIFICATION_STATUSES, required: true },
    error: { type: String, default: '' },
    sentAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

notificationLogSchema.index({ requestId: 1, donorUid: 1, channel: 1 }, { unique: true });

export type NotificationLogDoc = InferSchemaType<typeof notificationLogSchema>;
export const NotificationLog = model('NotificationLog', notificationLogSchema);
