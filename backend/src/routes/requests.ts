import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { BloodRequest, REQUEST_STATUSES, URGENCY_LEVELS } from '../models/BloodRequest';
import { RequestResponse } from '../models/RequestResponse';
import { NotificationLog } from '../models/NotificationLog';
import { Donor, BLOOD_GROUPS, BloodGroup } from '../models/Donor';
import { isSupportedLocality } from '../models/localities';
import { requireAdmin } from '../middleware/requireAdmin';
import { fanOutBloodRequest } from '../notifications/fanout';

const router = Router();

function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

const REQUEST_EXPIRY_DAYS = Number(process.env.REQUEST_EXPIRY_DAYS || 10);

// Flip any open requests older than REQUEST_EXPIRY_DAYS to status: 'expired'.
// Called opportunistically before list/get/create so the directory stays fresh
// without a background scheduler (which Render's free tier can't run reliably).
async function expireStaleRequests(): Promise<number> {
  const cutoff = new Date(Date.now() - REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  const result = await BloodRequest.updateMany(
    { status: 'open', createdAt: { $lt: cutoff } },
    { $set: { status: 'expired' } },
  );
  if (result.modifiedCount > 0) {
    console.log(`[requests] auto-expired ${result.modifiedCount} request(s) older than ${REQUEST_EXPIRY_DAYS} days`);
  }
  return result.modifiedCount;
}

// GET /api/requests — list (filters: bloodGroup, city, status). Defaults to open.
router.get('/', async (req: Request, res: Response) => {
  await expireStaleRequests();
  const { bloodGroup, city, status, matching } = req.query;
  const filter: Record<string, unknown> = {};

  // "matching=1" → filter by the calling donor's bloodGroup + city
  if (matching === '1') {
    const donor = await Donor.findOne({ firebaseUid: req.user!.uid });
    if (donor?.bloodGroup) filter.bloodGroup = donor.bloodGroup;
    if (donor?.city) filter.city = new RegExp(`^${donor.city}$`, 'i');
  } else {
    if (bloodGroup && BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
      filter.bloodGroup = bloodGroup;
    }
    if (city && typeof city === 'string' && city.trim()) {
      filter.city = new RegExp(`^${city.trim()}$`, 'i');
    }
  }

  filter.status = status && REQUEST_STATUSES.includes(status as any) ? status : 'open';

  const items = await BloodRequest.find(filter).sort({ createdAt: -1 }).limit(200);

  // Mark which of these the current user has already responded to (single batched query).
  const respondedIds = new Set<string>();
  if (items.length > 0) {
    const responses = await RequestResponse.find({
      donorUid: req.user!.uid,
      requestId: { $in: items.map((i) => i._id) },
    }).select('requestId');
    for (const r of responses) respondedIds.add(String(r.requestId));
  }

  res.json(
    items.map((i) => ({
      ...i.toObject(),
      hasResponded: respondedIds.has(String(i._id)),
    })),
  );
});

// GET /api/requests/:id — details (any auth)
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

  await expireStaleRequests();

  const item = await BloodRequest.findById(id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  const hasResponded = !!(await RequestResponse.exists({
    requestId: item._id,
    donorUid: req.user!.uid,
  }));
  res.json({ ...item.toObject(), hasResponded });
});

// POST /api/requests — admin only
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  const {
    bloodGroup, unitsNeeded, urgency, hospitalName, city,
    contactName, contactPhone, neededBy, notes,
  } = req.body || {};

  if (!BLOOD_GROUPS.includes(bloodGroup)) {
    return res.status(400).json({ error: 'Invalid bloodGroup' });
  }
  if (!unitsNeeded || unitsNeeded < 1) {
    return res.status(400).json({ error: 'unitsNeeded must be >= 1' });
  }
  if (!hospitalName?.trim() || !city?.trim() || !contactName?.trim() || !contactPhone?.trim()) {
    return res.status(400).json({ error: 'hospitalName, city, contactName, contactPhone are required' });
  }
  if (!isSupportedLocality(city)) {
    return res.status(400).json({ error: 'Unsupported locality' });
  }
  if (urgency && !URGENCY_LEVELS.includes(urgency)) {
    return res.status(400).json({ error: 'Invalid urgency' });
  }

  await expireStaleRequests();

  const doc = await BloodRequest.create({
    bloodGroup,
    unitsNeeded,
    urgency: urgency || 'normal',
    hospitalName: hospitalName.trim(),
    city: city.trim(),
    contactName: contactName.trim(),
    contactPhone: contactPhone.trim(),
    neededBy: neededBy ? new Date(neededBy) : null,
    notes: (notes || '').trim(),
    createdByUid: req.user!.uid,
  });

  // Fire-and-forget fan-out — don't block the API response on email sends.
  fanOutBloodRequest(doc as any)
    .then((summary) =>
      console.log(`[notify] request ${(doc as any)._id} fan-out:`, summary),
    )
    .catch((err) => console.error('[notify] fan-out failed', err));

  res.status(201).json(doc);
});

// POST /api/requests/:id/approve — admin only; flips pending_review → open and fans out
router.post('/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

  const doc = await BloodRequest.findById(id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  if (doc.status !== 'pending_review') {
    return res.status(409).json({ error: `Request is already ${doc.status}` });
  }

  doc.status = 'open';
  doc.createdByUid = req.user!.uid; // record who approved
  await doc.save();

  fanOutBloodRequest(doc as any)
    .then((summary) =>
      console.log(`[notify] approved request ${(doc as any)._id} fan-out:`, summary),
    )
    .catch((err) => console.error('[notify] fan-out failed', err));

  res.json(doc);
});

// POST /api/requests/:id/reject — admin only; flips pending_review → cancelled
router.post('/:id/reject', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

  const doc = await BloodRequest.findById(id);
  if (!doc) return res.status(404).json({ error: 'Not found' });
  if (doc.status !== 'pending_review') {
    return res.status(409).json({ error: `Request is already ${doc.status}` });
  }

  doc.status = 'cancelled';
  await doc.save();
  res.json(doc);
});

// PATCH /api/requests/:id — admin only (update status / fields)
router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

  const allowed = ['status', 'unitsNeeded', 'urgency', 'hospitalName', 'city',
                   'contactName', 'contactPhone', 'neededBy', 'notes'] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body && key in req.body) update[key] = req.body[key];
  }
  if (update.status && !REQUEST_STATUSES.includes(update.status as any)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const doc = await BloodRequest.findByIdAndUpdate(id, { $set: update }, { new: true });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

// POST /api/requests/:id/respond — donor expresses interest
router.post('/:id/respond', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

  await expireStaleRequests();

  const reqDoc = await BloodRequest.findById(id);
  if (!reqDoc) return res.status(404).json({ error: 'Not found' });
  if (reqDoc.status !== 'open') {
    return res.status(409).json({ error: `Request is ${reqDoc.status}` });
  }

  const note = (req.body?.note ?? '').toString().trim();
  try {
    const created = await RequestResponse.create({
      requestId: reqDoc._id,
      donorUid: req.user!.uid,
      note,
    });
    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'Already responded' });
    }
    throw err;
  }
});

// GET /api/requests/:id/notifications — admin only; fan-out summary
router.get('/:id/notifications', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

  const logs = await NotificationLog.find({ requestId: id }).sort({ sentAt: 1 });
  const summary = logs.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  res.json({
    total: logs.length,
    sent: summary.sent || 0,
    failed: summary.failed || 0,
    skipped: summary.skipped || 0,
    items: logs.map((l) => ({
      donorUid: l.donorUid,
      channel: l.channel,
      status: l.status,
      error: l.error,
      sentAt: l.sentAt,
    })),
  });
});

// GET /api/requests/:id/responders — admin only; returns Donor profiles + response note
router.get('/:id/responders', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

  const responses = await RequestResponse.find({ requestId: id }).sort({ createdAt: 1 });
  const uids = responses.map((r) => r.donorUid);
  const donors = await Donor.find({ firebaseUid: { $in: uids } });
  const donorByUid = new Map(donors.map((d) => [d.firebaseUid, d]));

  res.json(
    responses.map((r) => {
      const d = donorByUid.get(r.donorUid);
      return {
        responseId: r._id,
        respondedAt: r.createdAt,
        note: r.note,
        donor: d
          ? {
              uid: d.firebaseUid,
              firstName: d.firstName,
              lastName: d.lastName,
              bloodGroup: d.bloodGroup,
              phone: d.phone,
              city: d.city,
              lastDonationDate: d.lastDonationDate,
            }
          : null,
      };
    }),
  );
});

export default router;
