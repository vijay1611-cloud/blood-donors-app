# Blood Donors App

Donor-facing Angular 19 + Material app backed by Express, MongoDB, and Firebase Auth.

## Layout

- `frontend/` — Angular 19 app (standalone components, signals, Angular Material)
- `backend/`  — Express + TypeScript REST API on MongoDB; verifies Firebase ID tokens

## Prerequisites

- Node 22+, npm 10+
- MongoDB running locally on `mongodb://localhost:27017` (or set `MONGO_URI`)
- A Firebase project with **Email/Password** auth enabled

## One-time setup

### 1. Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. **Authentication → Sign-in method →** enable *Email/Password*
3. **Project settings → Service accounts → Generate new private key** → save the JSON as
   `backend/firebase-service-account.json` (this path is gitignored)
4. **Project settings → General → Your apps → Add Web app** → copy the config object
   into `frontend/src/environments/environment.development.ts` (replace the `YOUR_*`
   placeholders).

### 2. Backend env

```bash
cd backend
cp .env.example .env       # then edit values if needed
```

### 3. Install (already done by setup, but if cloning fresh)

```bash
cd backend  && npm install
cd frontend && npm install
```

## Running

In two terminals:

```bash
# Terminal 1 — API on http://localhost:4000
cd backend
npm run dev

# Terminal 2 — App on http://localhost:4200
cd frontend
npm start
```

Visit http://localhost:4200, sign up with an email/password, and you'll land on the
profile screen. Fill it in, then explore Directory and Donations.

## v1 features

- Email/password auth (Firebase)
- Donor profile (name, blood group, phone, city, willing-to-donate)
- Donor directory with blood-group + city filters
- Donation logging + history
- 90-day eligibility indicator (computed from latest donation)

Out of scope for v1 (planned v2): admin role, blood requests/notifications, push,
maps/geo search, phone OTP login.
