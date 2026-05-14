import { BloodRequestDoc } from '../models/BloodRequest';
import { NotificationMessage } from './types';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function urgencyColor(u: string): string {
  switch (u) {
    case 'critical': return '#c62828';
    case 'high': return '#ef6c00';
    case 'normal': return '#1976d2';
    default: return '#9e9e9e';
  }
}

export function bloodRequestEmail(
  req: BloodRequestDoc,
  donorFirstName: string,
  appBaseUrl: string,
): NotificationMessage {
  const link = `${appBaseUrl.replace(/\/$/, '')}/requests/${(req as any)._id}`;
  const greet = donorFirstName ? `Hi ${escapeHtml(donorFirstName)},` : 'Hi,';
  const urgencyLabel = req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1);
  const neededByText = req.neededBy
    ? ` by ${new Date(req.neededBy).toLocaleDateString()}`
    : '';

  const subject =
    req.urgency === 'critical'
      ? `URGENT: ${req.bloodGroup} blood needed at ${req.hospitalName}`
      : `${req.bloodGroup} blood needed at ${req.hospitalName}`;

  const textBody = [
    greet,
    '',
    `A blood request matches your donor profile.`,
    '',
    `Blood group: ${req.bloodGroup}`,
    `Hospital:    ${req.hospitalName}`,
    `Locality:    ${req.city}`,
    `Units:       ${req.unitsNeeded}`,
    `Urgency:     ${urgencyLabel}${neededByText}`,
    `Contact:     ${req.contactName} — ${req.contactPhone}`,
    req.notes ? `\nNotes: ${req.notes}` : '',
    '',
    `If you can help, open the request and click "I can help":`,
    link,
    '',
    `You're receiving this because your donor profile matches the blood group and city.`,
    `To stop these emails, open your profile and turn off email notifications.`,
  ].join('\n');

  const htmlBody = `
<!doctype html>
<html><body style="font-family:Helvetica,Arial,sans-serif;background:#fafafa;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #eee;">
    <div style="background:${urgencyColor(req.urgency)};color:#fff;padding:16px 24px;">
      <div style="font-size:13px;text-transform:uppercase;letter-spacing:1px;opacity:0.85;">${urgencyLabel} priority</div>
      <h1 style="margin:4px 0 0;font-size:22px;">${escapeHtml(req.bloodGroup)} needed at ${escapeHtml(req.hospitalName)}</h1>
    </div>
    <div style="padding:20px 24px;">
      <p style="margin:0 0 16px;">${greet}</p>
      <p style="margin:0 0 16px;">A blood request matches your donor profile.</p>

      <table style="border-collapse:collapse;width:100%;margin:16px 0;">
        <tr><td style="padding:6px 0;color:#666;width:120px;">Blood group</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(req.bloodGroup)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Hospital</td><td style="padding:6px 0;">${escapeHtml(req.hospitalName)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Locality</td><td style="padding:6px 0;">${escapeHtml(req.city)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Units</td><td style="padding:6px 0;">${req.unitsNeeded}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Urgency</td><td style="padding:6px 0;">${urgencyLabel}${escapeHtml(neededByText)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Contact</td><td style="padding:6px 0;">${escapeHtml(req.contactName)} — <a href="tel:${escapeHtml(req.contactPhone)}">${escapeHtml(req.contactPhone)}</a></td></tr>
      </table>

      ${req.notes ? `<div style="background:#fafafa;padding:12px;border-radius:6px;margin:12px 0;font-size:14px;"><strong>Notes:</strong> ${escapeHtml(req.notes)}</div>` : ''}

      <div style="margin:24px 0;">
        <a href="${link}" style="background:#c62828;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;display:inline-block;">View request &amp; offer to help</a>
      </div>

      <p style="font-size:12px;color:#888;margin:24px 0 0;">
        You received this because your donor profile matches the blood group and city.
        To stop, open your profile and turn off email notifications.
      </p>
    </div>
  </div>
</body></html>`.trim();

  return { subject, textBody, htmlBody };
}

export function pendingReviewAdminEmail(
  req: BloodRequestDoc,
  appBaseUrl: string,
): NotificationMessage {
  const link = `${appBaseUrl.replace(/\/$/, '')}/requests/${(req as any)._id}`;
  const urgencyLabel = req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1);
  const neededByText = req.neededBy
    ? ` by ${new Date(req.neededBy).toLocaleDateString()}`
    : '';

  const subject = `[Pending review] ${req.bloodGroup} blood request at ${req.hospitalName}`;

  const textBody = [
    `A new blood request has been submitted via the public emergency form and needs admin review.`,
    '',
    `Blood group: ${req.bloodGroup}`,
    `Hospital:    ${req.hospitalName}`,
    `Locality:    ${req.city}`,
    `Units:       ${req.unitsNeeded}`,
    `Urgency:     ${urgencyLabel}${neededByText}`,
    `Contact:     ${req.contactName} — ${req.contactPhone}`,
    req.notes ? `\nNotes: ${req.notes}` : '',
    '',
    `Open in the app to Approve or Reject:`,
    link,
  ].join('\n');

  const htmlBody = `
<!doctype html>
<html><body style="font-family:Helvetica,Arial,sans-serif;background:#fafafa;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #eee;">
    <div style="background:#ef6c00;color:#fff;padding:16px 24px;">
      <div style="font-size:13px;text-transform:uppercase;letter-spacing:1px;opacity:0.85;">Pending review</div>
      <h1 style="margin:4px 0 0;font-size:22px;">${escapeHtml(req.bloodGroup)} request at ${escapeHtml(req.hospitalName)}</h1>
    </div>
    <div style="padding:20px 24px;">
      <p style="margin:0 0 16px;">An unregistered user submitted an emergency blood request. Review and approve to notify matching donors.</p>

      <table style="border-collapse:collapse;width:100%;margin:16px 0;">
        <tr><td style="padding:6px 0;color:#666;width:120px;">Blood group</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(req.bloodGroup)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Hospital</td><td style="padding:6px 0;">${escapeHtml(req.hospitalName)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Locality</td><td style="padding:6px 0;">${escapeHtml(req.city)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Units</td><td style="padding:6px 0;">${req.unitsNeeded}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Urgency</td><td style="padding:6px 0;">${urgencyLabel}${escapeHtml(neededByText)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Contact</td><td style="padding:6px 0;">${escapeHtml(req.contactName)} — <a href="tel:${escapeHtml(req.contactPhone)}">${escapeHtml(req.contactPhone)}</a></td></tr>
      </table>

      ${req.notes ? `<div style="background:#fafafa;padding:12px;border-radius:6px;margin:12px 0;font-size:14px;"><strong>Notes:</strong> ${escapeHtml(req.notes)}</div>` : ''}

      <div style="margin:24px 0;">
        <a href="${link}" style="background:#ef6c00;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;display:inline-block;">Review request</a>
      </div>
    </div>
  </div>
</body></html>`.trim();

  return { subject, textBody, htmlBody };
}
