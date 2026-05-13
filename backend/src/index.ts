import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb } from './config/db';
import { initFirebase } from './config/firebase';
import { verifyToken } from './middleware/verifyToken';
import donorRoutes from './routes/donors';
import donationRoutes from './routes/donations';

const PORT = Number(process.env.PORT || 4000);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blooddonors';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

async function main() {
  initFirebase();
  await connectDb(MONGO_URI);

  const app = express();
  app.use(cors({ origin: CORS_ORIGINS }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/donors', verifyToken, donorRoutes);
  app.use('/api/donations', verifyToken, donationRoutes);

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[error]', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => console.log(`[server] listening on ${PORT}`));
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
