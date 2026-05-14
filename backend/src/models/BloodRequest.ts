import { Schema, model, InferSchemaType } from 'mongoose';
import { BLOOD_GROUPS } from './Donor';

export const URGENCY_LEVELS = ['low', 'normal', 'high', 'critical'] as const;
export const REQUEST_STATUSES = ['open', 'fulfilled', 'cancelled', 'expired'] as const;

export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

const bloodRequestSchema = new Schema(
  {
    bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true, index: true },
    unitsNeeded: { type: Number, required: true, min: 1, max: 50 },
    urgency: { type: String, enum: URGENCY_LEVELS, default: 'normal' },
    hospitalName: { type: String, required: true },
    city: { type: String, required: true, index: true },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    neededBy: { type: Date, default: null },
    notes: { type: String, default: '' },
    status: { type: String, enum: REQUEST_STATUSES, default: 'open', index: true },
    createdByUid: { type: String, required: true },
  },
  { timestamps: true },
);

bloodRequestSchema.index({ status: 1, bloodGroup: 1, city: 1 });

export type BloodRequestDoc = InferSchemaType<typeof bloodRequestSchema>;
export const BloodRequest = model('BloodRequest', bloodRequestSchema);
