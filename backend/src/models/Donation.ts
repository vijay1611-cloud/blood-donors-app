import { Schema, model, InferSchemaType } from 'mongoose';

const donationSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    location: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

donationSchema.index({ firebaseUid: 1, date: -1 });

export type DonationDoc = InferSchemaType<typeof donationSchema>;
export const Donation = model('Donation', donationSchema);
