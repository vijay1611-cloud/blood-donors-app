export interface Donation {
  _id?: string;
  firebaseUid?: string;
  date: string;
  location: string;
  notes: string;
  createdAt?: string;
}

export interface DonationInput {
  date: string;
  location?: string;
  notes?: string;
}
