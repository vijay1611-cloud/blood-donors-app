export const DAYS_BETWEEN_DONATIONS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface Eligibility {
  eligible: boolean;
  nextEligibleDate: Date | null;
}

export function computeEligibility(
  lastDonationDate: Date | string | null | undefined,
  now: Date = new Date(),
): Eligibility {
  if (!lastDonationDate) {
    return { eligible: true, nextEligibleDate: null };
  }
  const last = lastDonationDate instanceof Date ? lastDonationDate : new Date(lastDonationDate);
  const next = new Date(last.getTime() + DAYS_BETWEEN_DONATIONS * MS_PER_DAY);
  return { eligible: now >= next, nextEligibleDate: next };
}
