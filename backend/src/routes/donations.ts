import { Router, Request, Response } from 'express';
import { Donation } from '../models/Donation';
import { Donor } from '../models/Donor';

const router = Router();

// GET /api/donations — list current user's donations
router.get('/', async (req: Request, res: Response) => {
  const uid = req.user!.uid;
  const donations = await Donation.find({ firebaseUid: uid }).sort({ date: -1 }).limit(200);
  res.json(donations);
});

// POST /api/donations — log a new donation; also updates Donor.lastDonationDate if newer
router.post('/', async (req: Request, res: Response) => {
  const uid = req.user!.uid;
  const { date, location, notes } = req.body || {};
  if (!date) {
    return res.status(400).json({ error: 'date is required' });
  }
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return res.status(400).json({ error: 'date is invalid' });
  }

  const donation = await Donation.create({
    firebaseUid: uid,
    date: parsed,
    location: (location ?? '').toString().trim(),
    notes: (notes ?? '').toString().trim(),
  });

  // Roll forward Donor.lastDonationDate if this donation is the most recent
  const donor = await Donor.findOne({ firebaseUid: uid });
  if (donor && (!donor.lastDonationDate || parsed > donor.lastDonationDate)) {
    donor.lastDonationDate = parsed;
    await donor.save();
  }

  res.status(201).json(donation);
});

export default router;
