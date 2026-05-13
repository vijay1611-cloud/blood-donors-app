import { BloodGroup } from './blood-group';

export interface Eligibility {
  eligible: boolean;
  nextEligibleDate: string | null;
}

export interface Donor {
  id?: string;
  firebaseUid: string;
  firstName: string;
  lastName: string;
  bloodGroup: BloodGroup | null;
  phone: string;
  city: string;
  lastDonationDate: string | null;
  willingToDonate: boolean;
  eligibility: Eligibility;
}

export interface DonorUpdate {
  firstName?: string;
  lastName?: string;
  bloodGroup?: BloodGroup | null;
  phone?: string;
  city?: string;
  willingToDonate?: boolean;
}
