import { Donor } from '../models/Donor';
import { BloodRequestDoc } from '../models/BloodRequest';
import { NotificationLog } from '../models/NotificationLog';
import { sendgridProvider, emailProviderEnabled } from './sendgridProvider';
import { bloodRequestEmail } from './templates';
import { DAYS_BETWEEN_DONATIONS } from '../util/eligibility';

const DAILY_SEND_LIMIT = Number(process.env.EMAIL_DAILY_LIMIT || 100);

export interface FanOutSummary {
  matched: number;
  notified: number;
  failed: number;
  skipped: number;
  capReached: boolean;
}

export async function fanOutBloodRequest(req: BloodRequestDoc): Promise<FanOutSummary> {
  const summary: FanOutSummary = { matched: 0, notified: 0, failed: 0, skipped: 0, capReached: false };

  if (!emailProviderEnabled()) {
    console.warn('[notify] SendGrid not configured (SENDGRID_API_KEY/EMAIL_FROM); skipping fan-out');
    return summary;
  }

  const appBaseUrl = process.env.APP_BASE_URL || '';
  if (!appBaseUrl) {
    console.warn('[notify] APP_BASE_URL not set; emails will have empty deep links');
  }

  // Skip donors whose most recent donation was less than 90 days ago (matches the
  // in-app eligibility badge — see backend/src/util/eligibility.ts).
  const eligibilityCutoff = new Date(
    Date.now() - DAYS_BETWEEN_DONATIONS * 24 * 60 * 60 * 1000,
  );

  const donors = await Donor.find({
    bloodGroup: req.bloodGroup,
    city: new RegExp(`^${req.city}$`, 'i'),
    willingToDonate: true,
    receiveEmailNotifications: { $ne: false },
    email: { $regex: /.+@.+/ },
    $or: [
      { lastDonationDate: null },
      { lastDonationDate: { $exists: false } },
      { lastDonationDate: { $lte: eligibilityCutoff } },
    ],
  });
  summary.matched = donors.length;
  if (donors.length === 0) return summary;

  // Daily-cap guard: count sends in the last 24 hours.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sentToday = await NotificationLog.countDocuments({
    channel: 'email',
    status: 'sent',
    sentAt: { $gte: since },
  });
  let remaining = Math.max(0, DAILY_SEND_LIMIT - sentToday);

  for (const donor of donors) {
    if (remaining <= 0) {
      summary.capReached = true;
      summary.skipped += 1;
      await NotificationLog.create({
        requestId: (req as any)._id,
        donorUid: donor.firebaseUid,
        channel: 'email',
        recipient: donor.email,
        status: 'skipped',
        error: `daily cap ${DAILY_SEND_LIMIT} reached`,
      }).catch(() => {});
      continue;
    }

    const message = bloodRequestEmail(req, donor.firstName, appBaseUrl);
    const result = await sendgridProvider.send(
      { uid: donor.firebaseUid, email: donor.email },
      message,
    );

    try {
      await NotificationLog.create({
        requestId: (req as any)._id,
        donorUid: donor.firebaseUid,
        channel: 'email',
        recipient: donor.email,
        status: result.ok ? 'sent' : 'failed',
        error: result.error || '',
      });
    } catch (err: any) {
      // Duplicate key means we already logged this combo — safe to ignore.
      if (err?.code !== 11000) console.error('[notify] log write failed', err);
    }

    if (result.ok) {
      summary.notified += 1;
      remaining -= 1;
    } else {
      summary.failed += 1;
      console.warn(`[notify] failed for ${donor.email}: ${result.error}`);
    }
  }

  return summary;
}
