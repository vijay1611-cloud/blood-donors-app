import { BloodGroup } from './blood-group';

export const URGENCY_LEVELS = ['low', 'normal', 'high', 'critical'] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const REQUEST_STATUSES = [
  'pending_review', 'open', 'fulfilled', 'cancelled', 'expired',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export interface BloodRequest {
  _id: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgency: UrgencyLevel;
  hospitalName: string;
  city: string;
  contactName: string;
  contactPhone: string;
  neededBy: string | null;
  notes: string;
  status: RequestStatus;
  createdByUid: string;
  createdAt: string;
  updatedAt: string;
  hasResponded?: boolean;
}

export interface BloodRequestInput {
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgency?: UrgencyLevel;
  hospitalName: string;
  city: string;
  contactName: string;
  contactPhone: string;
  neededBy?: string | null;
  notes?: string;
}

export interface Responder {
  responseId: string;
  respondedAt: string;
  note: string;
  donor: {
    uid: string;
    firstName: string;
    lastName: string;
    bloodGroup: BloodGroup;
    phone: string;
    city: string;
    lastDonationDate: string | null;
  } | null;
}
