# 🏏 RCB Auction Predictor 2027 — WPL Fan Game

A full-stack mobile-first web application designed for Royal Challengers Bengaluru (RCB) fans to predict the team's WPL 2027 auction purchases and compete on a live leaderboard.

---

## 🌟 Key Features

- **Official WPL 2027 Auction Player Pool**: Preloaded with all 146 players across sets, reserve prices (₹10L – ₹50L), specialisms, country, and state association.
- **Squad Builder & Real-time Purse Engine**:
  - Live budget tracker (₹115 Lakh purse limit).
  - 2 to 5 player squad size enforcement.
  - Overseas player cap (max 2 overseas players).
  - Validation: Predicted price cannot be below official base price; no duplicate picks.
- **Frictionless Onboarding**:
  - Fan authentication with Display Name & 10-digit Indian mobile number.
  - No SMS OTP required; phone numbers masked as `******XXXX` for privacy.
- **Points Engine & Live Leaderboard**:
  - **+100 pts**: Correct RCB player purchase prediction.
  - **+75 pts bonus**: Exact purchase price hit.
  - **+40 pts bonus**: Near purchase price hit (within $\pm 10\%$).
  - **0 pts**: If player not purchased by RCB.
  - Tiebreaking by earliest entry timestamp.
  - Expandable participant breakdowns with itemized scores.
- **Admin Dashboard**:
  - Authentication-protected via secret key header (`x-admin-secret`).
  - Toggle contest lifecycle (`OPEN`, `LOCKED`, `RESULTS_LIVE`).
  - Set official auction outcomes and purchase prices.
  - Preview calculated scores before publishing.
  - 1-click **Export CSV** of participants, predictions, and scores.
  - Full audit log of admin operations.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, Express, TypeScript (`tsx`)
- **Testing**: Vitest (18 automated unit tests for validation & scoring)
- **Database**: File-based ACID JSON store with migration-ready PostgreSQL schema

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Default values:
```env
PORT=3001
ADMIN_SECRET=rcb_admin_secret_2027
```

### 3. Run the Development Servers
In separate terminals:

```bash
# Terminal 1: Backend API (port 3001)
npm run server

# Terminal 2: Vite Frontend (port 5173)
npm run dev
```

### 4. Run Automated Tests
```bash
npm test
```

### 5. Production Build
```bash
npm run build
```

---

## 🔒 Admin Access
To access the Admin Panel in the UI:
1. Navigate to the **Admin** tab.
2. Enter your `ADMIN_SECRET` (`rcb_admin_secret_2027` by default).
3. Manage contest statuses, record auction outcomes, and publish leaderboard rankings.
