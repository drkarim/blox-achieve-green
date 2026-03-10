<div align="center">

# 🎮 The Level Up Portal

### A Roblox-Inspired Gamified Achievement Tracker

*Turn daily chores, homework, and habits into an epic quest for XP and glory.*

![Tech Stack](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![tRPC](https://img.shields.io/badge/tRPC-11-398CCB?style=for-the-badge&logo=trpc&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Drizzle-00758F?style=for-the-badge&logo=mysql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

---

## What Is This?

The Level Up Portal is a full-stack web application that gamifies everyday tasks for young users. Inspired by the iconic **Roblox** interface, it wraps real-world responsibilities — homework, chores, reading, exercise — in a video-game reward loop: complete tasks, earn XP, fill the progress bar, and trigger a **LEVEL UP** celebration complete with green confetti. Every action is saved to a database, so progress persists across sessions, devices, and days.

The project was built with a 10-year-old user in mind, with a deliberate focus on visual clarity, immediate feedback, and the kind of chunky, tactile UI that makes tapping a button feel genuinely satisfying.

---

## Screenshots

| Landing Page | Dashboard | Badge Room |
|:---:|:---:|:---:|
| ![Home](https://img.shields.io/badge/Home-Page-32CD32?style=flat-square) | ![Dashboard](https://img.shields.io/badge/Dashboard-View-32CD32?style=flat-square) | ![Badges](https://img.shields.io/badge/Badge-Room-32CD32?style=flat-square) |
| Register or log in to begin | Complete quests, track XP | Unlock badges as you level up |

---

## Features

### User System
A complete local authentication system built without any third-party OAuth dependency. Users register with a username and password; passwords are hashed with **bcrypt** (12 rounds) before storage. Sessions are maintained via signed HTTP-only cookies that persist for 7 days. The dashboard greets every returning player with **"Welcome back, [Username]!"** prominently displayed in the Bangers gaming font.

### The Quest Dashboard
Five daily quest cards are presented on the main dashboard, each representing a real-world task the player should complete that day. Every card displays the quest name, a short motivational description, the XP reward, and a chunky green **Complete** button. Once a quest is marked done, the card immediately updates to a strikethrough "✓ Done!" state via optimistic UI updates — no waiting for the server.

| Quest | Description | XP |
|---|---|---|
| ⚡ Daily Grind | Start your day strong — complete your morning routine | +50 XP |
| 📚 Homework Quest | Conquer your homework and level up your brain | +50 XP |
| 🏠 Room Recon | Clean and organise your room like a pro | +50 XP |
| 📖 Reading Mission | Read for at least 20 minutes today | +50 XP |
| 🏋️ Custom Training | Exercise, practise, or learn something new | +50 XP |

Quests reset automatically every day at midnight. The system stores completions as SQL `DATE` values using local time components to prevent timezone drift.

### XP & Levelling System
Each completed quest awards **+50 XP**. A high-contrast animated progress bar at the top of the screen shows current XP progress toward the next level threshold (500 XP). When the bar fills, a full-screen **LEVEL UP** overlay fires — complete with a burst of green confetti powered by `canvas-confetti` — and the player's level increments permanently. The system tracks both per-level XP (which resets on level-up) and lifetime total XP (which never resets and drives XP-based badge unlocks).

### Badge Room
Eight achievement badges are displayed in a grid at the bottom of the dashboard. Locked badges render in greyscale at reduced opacity. When a badge condition is met, it unlocks instantly: full colour returns, a neon green glow appears around the card, and a toast notification announces the unlock. Badges reward a mix of milestones — first quest completion, reaching specific levels, and accumulating lifetime XP.

| Badge | Condition |
|---|---|
| 🗡️ First Blood | Complete your very first quest |
| ⭐ Rising Star | Reach Level 2 |
| 🏆 Veteran | Reach Level 5 |
| 👑 Legend | Reach Level 10 |
| 💎 XP Hunter | Earn 500 total XP |
| 🔥 XP Master | Earn 1,000 total XP |
| 💪 The Grinder | Earn 2,500 total XP |
| ⚡ XP God | Earn 5,000 total XP |

### Full Persistence
All progress — current level, XP, completed quests, and unlocked badges — is stored in a MySQL database via Drizzle ORM. Refreshing the page, logging out, or returning the next day never loses progress. Quest completions are day-scoped so the same quest can be completed again tomorrow.

---

## Design System — "Ninja Turtle Green"

The entire visual identity is built around the **TMNT (Ninja Turtle) green** palette, rendered on a near-black dark slate background to maximise contrast and make the greens pop.

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| **Neon Lime** | `oklch(0.72 0.22 142)` | `#32CD32` | Buttons, XP bar fill, badge glow, active states |
| **Deep Forest** | `oklch(0.35 0.15 142)` | `#006400` | Button shadows, panel borders, header backgrounds |
| **Dark Slate** | `oklch(0.09 0.02 145)` | `#121212` | Page background |
| **Surface** | `oklch(0.13 0.04 142)` | `#1a1f1a` | Cards and panels |
| **Text** | `oklch(0.97 0.01 145)` | `#f0fff0` | Primary readable text |

> Tailwind CSS 4 requires colours in **OKLCH format** inside `@theme` blocks. HSL values are not supported in this version.

Typography uses **Bangers** (Google Fonts) for all headings and game-style text, and **Fredoka** for body copy, labels, and form inputs. Every interactive button uses the `.roblox-btn` CSS class, which applies a thick bottom shadow to simulate a raised 3D block, with `:hover` growing the button slightly upward and `:active` squishing it down — mimicking the tactile feel of a Roblox menu button.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19 |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS | 4 |
| UI components | shadcn/ui + Radix UI | latest |
| Routing | Wouter | 3 |
| API layer | tRPC | 11 |
| Backend runtime | Node.js + Express | 22 / 4 |
| Database ORM | Drizzle ORM | latest |
| Database | MySQL / TiDB | — |
| Password hashing | bcryptjs | latest |
| Confetti animation | canvas-confetti | latest |
| Animations | Framer Motion | 12 |
| Testing | Vitest | 2 |
| Package manager | pnpm | 10 |

---

## Project Structure

```
level-up-portal/
├── client/
│   ├── index.html              # Google Fonts CDN + app shell
│   └── src/
│       ├── index.css           # Global theme: roblox-btn, xp-bar, badge-item, etc.
│       ├── App.tsx             # Route definitions
│       └── pages/
│           ├── Home.tsx        # Landing page
│           ├── Login.tsx       # Login form
│           ├── Register.tsx    # Registration form
│           └── Dashboard.tsx   # Main game screen
├── server/
│   ├── routers.ts              # All tRPC procedures + QUESTS/BADGES constants
│   ├── db.ts                   # Database query helpers
│   ├── levelup.test.ts         # 18 feature tests
│   └── auth.logout.test.ts     # Session/cookie tests
├── drizzle/
│   └── schema.ts               # Database table definitions (source of truth)
├── shared/
│   └── const.ts                # Shared constants (cookie name, etc.)
├── CLAUDE.md                   # AI coding assistant project brain
└── README.md                   # This file
```

---

## Database Schema

```
users            — User accounts (supports both local and OAuth login)
user_progress    — Per-user XP, level, and lifetime total XP
user_quests      — Daily quest completion records (date-scoped)
user_badges      — Earned badge records with unlock timestamps
```

The `users` table is extended with `username` and `passwordHash` columns to support local authentication alongside the built-in OAuth flow. Local users receive a synthetic `openId` (`local_<username>_<timestamp>`) so they integrate transparently with the existing session infrastructure.

---

## Getting Started

### Prerequisites

Node.js 22+, pnpm 10+, and a MySQL-compatible database are required.

### Installation

```bash
# Clone the repository
git clone https://github.com/drkarim/blox-achieve-green.git
cd blox-achieve-green

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL and JWT_SECRET

# Apply the database schema
pnpm drizzle-kit generate
# Then apply the generated SQL to your database

# Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Secret key for signing session cookies |
| `VITE_APP_ID` | OAuth application ID (optional for local-only auth) |

### CLI Commands

```bash
pnpm dev              # Start dev server (frontend + backend, port 3000)
pnpm build            # Production build
pnpm start            # Run production build
pnpm test             # Run all Vitest tests
pnpm check            # TypeScript type-check (no emit)
pnpm drizzle-kit generate   # Generate migration SQL from schema changes
```

---

## Testing

The project ships with **19 Vitest tests** covering all critical paths:

```bash
pnpm test
```

Test coverage includes registration validation (duplicate usernames, password length, special characters), login authentication, quest listing and completion, XP award logic, level-up detection at the 500 XP threshold, badge unlock conditions, and the session cookie lifecycle. All tests mock the database layer and the session SDK so they run without a live database connection.

---

## Customisation

The portal is designed to be easily adapted. The most common customisations are:

**Change quest names or descriptions** — Edit the `QUESTS` array in `server/routers.ts`. Each quest has a `key`, `label`, `description`, `icon`, and `xp` field.

**Adjust XP per quest or XP to level up** — Change the `xp` value on individual quests in `QUESTS`, or change the `XP_PER_LEVEL` constant in `server/db.ts` (currently `500`).

**Add new badges** — Add an entry to the `BADGES` array in `server/routers.ts` and add the corresponding unlock condition to `checkAndUnlockBadges()` in `server/db.ts`.

**Change the colour scheme** — Edit the CSS variables in `client/src/index.css`. All colours use OKLCH format. The primary neon green is `oklch(0.72 0.22 142)`.

---

## Architecture Notes

**Why tRPC?** All client–server communication goes through tRPC procedures, which means the TypeScript types defined on the server are automatically available in the frontend with no manual contract files or code generation step. Adding a new feature means writing one procedure in `server/routers.ts` and calling `trpc.feature.useQuery()` in the component — nothing else.

**Why local auth instead of OAuth?** The target user (a 10-year-old) does not have a Manus or Google account. Local username/password auth with bcrypt is the most accessible option. The implementation uses the same session cookie infrastructure as the OAuth flow, so both can coexist if needed.

**Why SQL `DATE` for quest completions?** Storing a `TIMESTAMP` and comparing with `DATE()` in SQL would work, but constructing the comparison date from `new Date().toISOString()` introduces a UTC offset that shifts the date backward for users in UTC+ timezones, causing quests completed in the evening to appear as "already completed" the next morning. Using a `DATE` column populated with `new Date(year, month, day)` (local time components) eliminates this class of bug entirely.

**Optimistic updates** — Quest completion uses the `onMutate` / `onError` / `onSettled` tRPC mutation pattern. The quest card flips to "Done!" instantly on click; if the server returns an error, the cache rolls back automatically. This makes the UI feel instantaneous even on slow connections.

---

## Contributing

This is a personal project, but pull requests are welcome. Please run `pnpm check` and `pnpm test` before submitting — both must pass with zero errors.

---

## Licence

MIT — see `LICENSE` for details.

---

<div align="center">

Built with ⚡ by **drkarim** · Powered by tRPC, Drizzle, React 19, and way too much neon green

</div>
