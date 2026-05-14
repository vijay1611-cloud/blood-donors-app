import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { BloodRequest, REQUEST_STATUSES, URGENCY_LEVELS } from '../models/BloodRequest';
import { RequestResponse } from '../models/RequestResponse';
import { Donor, BLOOD_GROUPS, BloodGroup } from '../models/Donor';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

// GET /api/requests — list (filters: bloodGroup, city, status). Defaults to open.
router.get('/', async (req: Request, res: Response) => {
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
  res.json(items);
});

// GET /api/requests/:id — details (any auth)
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });

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
  if (urgency && !URGENCY_LEVELS.includes(urgency)) {
    return res.status(400).json({ error: 'Invalid urgency' });
  }

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

  res.status(201).json(doc);
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
