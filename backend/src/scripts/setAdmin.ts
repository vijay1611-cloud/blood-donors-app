/**
 * Usage:
 *   npx ts-node src/scripts/setAdmin.ts grant <email>
 *   npx ts-node src/scripts/setAdmin.ts revoke <email>
 *
 * Requires the same env as the API (FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_JSON).
 */
import 'dotenv/config';
import { admin, initFirebase } from '../config/firebase';

async function main() {
  const [, , action, email] = process.argv;
  if (!action || !email || !['grant', 'revoke'].includes(action)) {
    console.error('Usage: setAdmin.ts <grant|revoke> <email>');
    process.exit(1);
  }

  initFirebase();

  const user = await admin.auth().getUserByEmail(email);
  const next = action === 'grant';
  await admin.auth().setCustomUserClaims(user.uid, next ? { admin: true } : {});
  console.log(`${action === 'grant' ? 'Granted' : 'Revoked'} admin claim for ${email} (uid ${user.uid})`);
  console.log('Note: the user must sign out and back in (or call getIdToken(true)) to pick up the new claim.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
