# MatchMyStuff

**Powered by AI. Driven by kindness.**

MatchMyStuff is a real-time, AI-powered lost-and-found platform. People report items they have lost or found; the system understands photos and descriptions, compares reports semantically, and connects matching pairs through secure in-app chat.

Built for communities in Sri Lanka and beyond.

---

## About This Project

Every day, phones, wallets, keys, and bags are left behind on buses, at cafés, and in public spaces. Traditional lost-and-found boards are slow, easy to miss, and rarely help people connect across locations.

MatchMyStuff solves that by combining:

- **Computer vision** — GPT-4o analyzes item photos and builds detailed visual descriptions.
- **Semantic search** — Vector embeddings compare lost and found posts by meaning, not just keywords.
- **Real-time backend** — Convex powers live data, auth, storage, matching, chat, and notifications.
- **Safe coordination** — Matched users chat in-app (text, photos, location) without exposing email on public listings.

The goal is simple: reunite belongings faster. When someone reports a lost item and someone else reports a matching found item, both users are notified and can arrange a handoff privately.

---

## Features

### Reporting

- **Lost and found posts** — Separate flows for “I lost something” and “I found something.”
- **Photo or describe-only** — Upload a photo (with inline crop, rotate, and zoom) or submit title, description, and location without an image.
- **Found items require a photo** — Ensures owners can visually identify found property.
- **Image validation** — GPT-4o rejects faces, memes, screenshots, NSFW content, and non-item images before processing.
- **Location on every report** — Used in matching and shown on the community map.

### AI & Matching

- **Visual analysis** — Dedicated vision pass describes color, brand, material, condition, and distinctive marks (high-detail mode).
- **Text summaries** — Description-only posts still get an AI summary for embedding.
- **Semantic embeddings** — OpenAI `text-embedding-3-small` over title, user description, AI analysis, and location.
- **Smart pairing** — Vector search plus blended scoring (cosine similarity, location overlap, keyword overlap).
- **Cross-user matching** — Lost posts match against found posts from **other** users (and vice versa).
- **Match confidence** — Each match stores a score; users see percentage on the matches page.
- **Automatic rematching** — New ready posts trigger matching against recent opposite-type posts.

### Discovery & Feed

- **Public feed** — Recently reported lost and found items on the home page.
- **Search** — Filter posts by title and description.
- **Interactive map** — Leaflet map with pins for lost/found items; place search and optional geolocation.
- **Post detail** — Full description, AI analysis, processing status, and rejection reasons when applicable.

### Account & Posts

- **Email/password auth** — Sign up and sign in via Convex Auth.
- **My Posts** — View your reports and status (processing, live, photo rejected).
- **Processing pipeline** — Posts move through pending → processing → ready (or rejected) with clear UI feedback.

### Matches & Notifications

- **Matches page** — Side-by-side view of matched lost/found posts with confidence score.
- **In-app notifications** — Bell icon when a new match is found.
- **Email alerts** — Optional Gmail notifications with a link to matches (when configured).

### Messaging

- **Match-based chat** — Only users involved in a match can message each other.
- **Floating chat widget** — Quick access from any authenticated page (except dedicated chat routes).
- **Message types** — Text, image uploads, and share location (opens in Google Maps).
- **Conversations list** — Full-page inbox with unread indicators.
- **Real-time updates** — Powered by Convex subscriptions.

### Admin

- **Admin dashboard** — Overview stats for users, posts, and matches.
- **Manage users, posts, matches** — View and delete records (with optional cascade).
- **Separate admin login** — Protected routes under `/admin`.

### Legal & Info

- Privacy policy, terms of service, and contact pages.

---

## Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Framer Motion |
| Backend | [Convex](https://convex.dev) (database, functions, file storage, vector search) |
| Auth | [@convex-dev/auth](https://labs.convex.dev/auth) (email/password) |
| AI | OpenAI GPT-4o (vision, validation, summaries), text-embedding-3-small |
| Map | Leaflet, react-leaflet |
| Email | Nodemailer (Gmail) |
| Deploy | Vercel (frontend) + Convex Cloud (backend) |

---

## How It Works

1. **Report** — User creates a lost or found post with title, description, location, and optional photo.
2. **Process** — Backend validates the image (if any), generates an AI description, builds an embedding, and marks the post ready.
3. **Match** — System searches opposite-type posts (lost ↔ found), scores candidates, and creates matches above the threshold.
4. **Notify** — Both users get in-app notifications (and email if configured).
5. **Chat** — Matched users coordinate pickup through secure messaging.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- [Convex](https://convex.dev) account
- [OpenAI](https://platform.openai.com) API key

### Install

```bash
git clone <your-repo-url>
cd matchmystuff
npm install
```

### Environment

**Local (`.env.local`):**

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

**Convex dashboard (Production deployment):**

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Image validation, descriptions, embeddings |
| `JWT_PRIVATE_KEY` / `JWKS` | Convex Auth (set via `npx @convex-dev/auth`) |
| `SITE_URL` | Your app URL (e.g. `https://your-app.vercel.app`) |
| `APP_BASE_URL` | Base URL for links in match emails |
| `EMAIL_SENDER` / `EMAIL_PASS` | Optional Gmail for match notifications |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional admin panel login |

`CONVEX_SITE_URL` is provided automatically by Convex — do not override it.

### Run locally

Terminal 1 — Convex backend:

```bash
npx convex dev
```

Terminal 2 — Next.js frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

---

## Deploy

1. **Convex** — `npx convex deploy` (set production env vars in the dashboard).
2. **Vercel** — Import the repo; set `NEXT_PUBLIC_CONVEX_URL` to your production Convex URL; deploy.
3. **Rematch existing posts** (after matcher updates) — `npx convex run internal/actions:backfillMatches`

---

## Project Structure

```
matchmystuff/
├── app/                    # Next.js pages (home, auth, report, matches, chat, admin)
├── components/             # UI (Navbar, PostCard, MapView, chat widget, ImageEditor)
├── convex/                 # Backend schema, mutations, actions, matching pipeline
│   ├── actions.ts          # AI processing, embeddings, findMatches
│   ├── posts.ts            # Post CRUD
│   ├── matches.ts          # Match creation & queries
│   ├── conversations.ts    # Chat threads
│   ├── messages.ts         # Chat messages
│   └── lib/                # Similarity, image validation, image describe
├── lib/                    # Shared copy, colors, toast helpers
└── public/                 # Static assets (logo, floating item PNGs)
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run convex:dev` | Start Convex dev (alias for `npx convex dev`) |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |

---

## License

Private project. All rights reserved.
