import { Schema, model, InferSchemaType, Types } from 'mongoose';

const requestResponseSchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'BloodRequest', required: true, index: true },
    donorUid: { type: String, required: true, index: true },
    note: { type: String, default: '' },
  },
  { timestamps: true },
);

requestResponseSchema.index({ requestId: 1, donorUid: 1 }, { unique: true });

export type RequestResponseDoc = InferSchemaType<typeof requestResponseSchema>;
export const RequestResponse = model('RequestResponse', requestResponseSchema);
