import { Router, Request, Response } from 'express';
import { BloodRequest, URGENCY_LEVELS } from '../models/BloodRequest';
import { BLOOD_GROUPS } from '../models/Donor';
import { isSupportedLocality } from '../models/localities';
import { notifyAdminsOfPendingRequest } from '../notifications/adminAlerts';

const router = Router();

// POST /api/public/requests — unauthenticated emergency submission
router.post('/requests', async (req: Request, res: Response) => {
  const {
    bloodGroup, unitsNeeded, urgency, hospitalName, city,
    contactName, contactPhone, neededBy, notes,
  } = req.body || {};

  if (!BLOOD_GROUPS.includes(bloodGroup)) {
    return res.status(400).json({ error: 'Invalid bloodGroup' });
  }
  if (!unitsNeeded || unitsNeeded < 1 || unitsNeeded > 50) {
    return res.status(400).json({ error: 'unitsNeeded must be between 1 and 50' });
  }
  if (!hospitalName?.trim() || !contactName?.trim() || !contactPhone?.trim()) {
    return res.status(400).json({ error: 'hospitalName, contactName, contactPhone are required' });
  }
  if (!city || !isSupportedLocality(city)) {
    return res.status(400).json({ error: 'Pick a supported Chennai locality' });
  }
  if (urgency && !URGENCY_LEVELS.includes(urgency)) {
    return res.status(400).json({ error: 'Invalid urgency' });
  }

  const phone = String(contactPhone).trim();
  if (phone.length < 6) {
    return res.status(400).json({ error: 'contactPhone looks invalid' });
  }

  // Rate limit: same phone can have at most 1 pending_review submission per hour.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await BloodRequest.countDocuments({
    contactPhone: phone,
    status: 'pending_review',
    createdAt: { $gte: oneHourAgo },
  });
  if (recent > 0) {
    return res.status(429).json({
      error:
        'You already submitted a request from this phone in the last hour. Please wait for the admin to review it, or call the hospital directly.',
    });
  }

  const doc = await BloodRequest.create({
    bloodGroup,
    unitsNeeded,
    urgency: urgency || 'normal',
    hospitalName: hospitalName.trim(),
    city: city.trim(),
    contactName: contactName.trim(),
    contactPhone: phone,
    neededBy: neededBy ? new Date(neededBy) : null,
    notes: (notes || '').trim(),
    status: 'pending_review',
    submittedByPublic: true,
  });

  // Fire-and-forget admin notification.
  notifyAdminsOfPendingRequest(doc as any)
    .then((r) => console.log(`[public] admin notify summary for request ${(doc as any)._id}:`, r))
    .catch((err) => console.error('[public] admin notify failed', err));

  res.status(201).json({
    id: doc._id,
    status: doc.status,
    message:
      'Your emergency request has been submitted. An administrator will review and approve it shortly. Matching donors will be notified after approval.',
  });
});

export default router;
