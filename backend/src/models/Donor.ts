import { Schema, model, InferSchemaType } from 'mongoose';

export const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

const donorSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, default: null },
    phone: { type: String, default: '' },
    city: { type: String, default: '', index: true },
    lastDonationDate: { type: Date, default: null },
    willingToDonate: { type: Boolean, default: true },
  },
  { timestamps: true },
);

donorSchema.index({ bloodGroup: 1, city: 1 });

export type DonorDoc = InferSchemaType<typeof donorSchema>;
export const Donor = model('Donor', donorSchema);
