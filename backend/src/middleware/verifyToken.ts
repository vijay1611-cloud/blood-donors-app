import { Request, Response, NextFunction } from 'express';
import { admin } from '../config/firebase';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
      };
    }
  }
}

export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.header('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (!match) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.user = { uid: decoded.uid, email: decoded.email };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
