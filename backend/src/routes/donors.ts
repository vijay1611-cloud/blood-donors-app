import { Router, Request, Response } from 'express';
import { Donor, BLOOD_GROUPS, BloodGroup } from '../models/Donor';
import { isSupportedLocality } from '../models/localities';
import { computeEligibility } from '../util/eligibility';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

function serializeDonor(d: any) {
  const eligibility = computeEligibility(d.lastDonationDate);
  return {
    id: d._id,
    firebaseUid: d.firebaseUid,
    email: d.email,
    firstName: d.firstName,
    lastName: d.lastName,
    bloodGroup: d.bloodGroup,
    phone: d.phone,
    city: d.city,
    lastDonationDate: d.lastDonationDate,
    willingToDonate: d.willingToDonate,
    receiveEmailNotifications: d.receiveEmailNotifications,
    eligibility,
  };
}

// GET /api/donors/me — current donor profile (creates an empty one on first call)
router.get('/me', async (req: Request, res: Response) => {
  const uid = req.user!.uid;
  const tokenEmail = req.user!.email || '';

  let donor = await Donor.findOne({ firebaseUid: uid });
  if (!donor) {
    donor = await Donor.create({ firebaseUid: uid, email: tokenEmail });
  } else if (tokenEmail && donor.email !== tokenEmail) {
    donor.email = tokenEmail;
    await donor.save();
  }
  res.json(serializeDonor(donor));
});

// PUT /api/donors/me — update current donor profile
router.put('/me', async (req: Request, res: Response) => {
  const uid = req.user!.uid;
  const tokenEmail = req.user!.email || '';
  const {
    firstName, lastName, bloodGroup, phone, city,
    willingToDonate, receiveEmailNotifications,
  } = req.body || {};

  if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
    return res.status(400).json({ error: `Invalid bloodGroup. Allowed: ${BLOOD_GROUPS.join(', ')}` });
  }
  if (city && !isSupportedLocality(String(city))) {
    return res.status(400).json({ error: 'Unsupported locality' });
  }

  const update: Record<string, unknown> = {};
  if (firstName !== undefined) update.firstName = String(firstName).trim();
  if (lastName !== undefined) update.lastName = String(lastName).trim();
  if (bloodGroup !== undefined) update.bloodGroup = bloodGroup || null;
  if (phone !== undefined) update.phone = String(phone).trim();
  if (city !== undefined) update.city = String(city).trim();
  if (willingToDonate !== undefined) update.willingToDonate = !!willingToDonate;
  if (receiveEmailNotifications !== undefined) {
    update.receiveEmailNotifications = !!receiveEmailNotifications;
  }
  if (tokenEmail) update.email = tokenEmail;

  const donor = await Donor.findOneAndUpdate(
    { firebaseUid: uid },
    { $set: update },
    { new: true, upsert: true },
  );
  res.json(serializeDonor(donor));
});

// GET /api/donors — search directory (admin only)
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  const { bloodGroup, city } = req.query;
  const filter: Record<string, unknown> = { willingToDonate: true };
  if (bloodGroup && BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
    filter.bloodGroup = bloodGroup;
  }
  if (city && typeof city === 'string' && city.trim()) {
    filter.city = new RegExp(`^${city.trim()}$`, 'i');
  }
  const donors = await Donor.find(filter).limit(200).sort({ updatedAt: -1 });
  res.json(donors.map(serializeDonor));
});

export default router;
