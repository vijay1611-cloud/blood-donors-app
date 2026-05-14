import { admin } from '../config/firebase';
import { BloodRequestDoc } from '../models/BloodRequest';
import { sendgridProvider, emailProviderEnabled } from './sendgridProvider';
import { pendingReviewAdminEmail } from './templates';

export interface AdminAlertSummary {
  admins: number;
  sent: number;
  failed: number;
}

async function listAdminEmails(): Promise<string[]> {
  const result = await admin.auth().listUsers(1000);
  return result.users
    .filter((u) => u.customClaims?.['admin'] === true && !!u.email)
    .map((u) => u.email!);
}

export async function notifyAdminsOfPendingRequest(
  req: BloodRequestDoc,
): Promise<AdminAlertSummary> {
  const summary: AdminAlertSummary = { admins: 0, sent: 0, failed: 0 };

  if (!emailProviderEnabled()) {
    console.warn('[adminAlerts] SendGrid not configured; skipping admin notification');
    return summary;
  }

  const adminEmails = await listAdminEmails();
  summary.admins = adminEmails.length;
  if (adminEmails.length === 0) {
    console.warn('[adminAlerts] no admins to notify');
    return summary;
  }

  const appBaseUrl = process.env.APP_BASE_URL || '';
  const message = pendingReviewAdminEmail(req, appBaseUrl);

  for (const email of adminEmails) {
    const result = await sendgridProvider.send({ uid: '', email }, message);
    if (result.ok) summary.sent += 1;
    else {
      summary.failed += 1;
      console.warn(`[adminAlerts] send failed for ${email}: ${result.error}`);
    }
  }
  return summary;
}
