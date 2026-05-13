import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

export function initFirebase(): void {
  if (admin.apps.length > 0) return;

  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT;

  let serviceAccount: admin.ServiceAccount;

  if (inlineJson && inlineJson.trim()) {
    try {
      serviceAccount = JSON.parse(inlineJson);
    } catch (err) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
    }
  } else if (filePath) {
    const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolved)) {
      throw new Error(
        `Firebase service account file not found at ${resolved}. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT in env`,
      );
    }
    serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  } else {
    throw new Error(
      'Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON (inline JSON) or FIREBASE_SERVICE_ACCOUNT (file path).',
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('[firebase] admin initialized');
}

export { admin };
