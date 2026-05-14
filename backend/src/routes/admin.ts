import { Router, Request, Response } from 'express';
import { admin } from '../config/firebase';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// All admin endpoints require an admin caller.
router.use(requireAdmin);

// GET /api/admin/users — list users (up to the first page of 1000) with admin claim.
router.get('/users', async (_req: Request, res: Response) => {
  const result = await admin.auth().listUsers(1000);
  const admins = result.users
    .filter((u) => u.customClaims?.['admin'] === true)
    .map((u) => ({
      uid: u.uid,
      email: u.email || '',
      displayName: u.displayName || '',
      createdAt: u.metadata.creationTime,
      lastSignInAt: u.metadata.lastSignInTime,
    }));
  res.json({ admins });
});

// POST /api/admin/users/grant  { email }
router.post('/users/grant', async (req: Request, res: Response) => {
  const email = (req.body?.email || '').toString().trim();
  if (!email) return res.status(400).json({ error: 'email is required' });

  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
  } catch {
    return res.status(404).json({ error: `No Firebase user with email ${email}` });
  }

  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  res.json({
    uid: user.uid,
    email: user.email || '',
    admin: true,
    message:
      'Granted. User must sign out and back in (or refresh their ID token) to pick up the new claim.',
  });
});

// POST /api/admin/users/revoke  { email }
router.post('/users/revoke', async (req: Request, res: Response) => {
  const email = (req.body?.email || '').toString().trim();
  if (!email) return res.status(400).json({ error: 'email is required' });

  if (email === req.user!.email) {
    return res.status(400).json({ error: 'You cannot revoke your own admin access' });
  }

  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
  } catch {
    return res.status(404).json({ error: `No Firebase user with email ${email}` });
  }

  const existing = user.customClaims || {};
  const { admin: _drop, ...rest } = existing as Record<string, unknown>;
  await admin.auth().setCustomUserClaims(user.uid, rest);
  res.json({
    uid: user.uid,
    email: user.email || '',
    admin: false,
    message: 'Revoked. User must sign out and back in to lose admin access.',
  });
});

export default router;
