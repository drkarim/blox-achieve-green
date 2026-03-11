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
Five daily quest cards are presented on the main dashboard, each representing a real-world task the player should complete that day. Every card displays the quest name, a short motivational description, the XP reward, and a chunky green **Complete** button. Once a quest is marked done, the card immediately updates to a strikethrough state via optimistic UI updates — no waiting for the server.

Completed quests display an amber **"↩ Undo"** button in place of the Complete button. Clicking Undo removes the completion record from the database, subtracts the 50 XP, and instantly restores the quest to its incomplete state — again via optimistic updates so the UI responds before the server confirms. If the XP subtraction causes the player's current-level XP to go negative, the system automatically decrements the level and carries the remaining XP forward (e.g. undoing a quest at 30 XP on Level 2 drops to Level 1 at 480 XP). The XP hint on the card also updates to show **"-50 XP if undone"** while a quest is in the completed state, so the player always knows the consequence before clicking.

| Quest | Description | XP | Type |
|---|---|---|---|
| ⚡ Daily Grind | Start your day strong — complete your morning routine | +50 XP | Standard |
| 📚 Homework Quest | Conquer your homework and level up your brain | +50 XP | Standard |
| 🏠 Room Recon | Clean and organise your room like a pro | +50 XP | Standard |
| 📖 Reading Mission | Read for at least 20 minutes today | +50 XP | Standard |
| 🏋️ Custom Training | Exercise, practise, or learn something new | +50 XP | Standard |
| 🌿 Power Down: The Offline Buff | Completed at least 1 hour of screen-free time | **+80 XP** | Legendary |
| 💀 System Glitch | A corruption in the system. Activate at your own risk! | **−30 XP** | Glitch |

Quests reset automatically every day at midnight. The system stores completions as SQL `DATE` values using local time components to prevent timezone drift.

### XP & Levelling System
Standard quests award **+50 XP** each. The legendary **Power Down: The Offline Buff** quest awards a boosted **+80 XP** for completing at least one hour of screen-free time — its card pulses with a continuous neon green glow animation to signal its special status. The **System Glitch** quest is the only non-green element in the entire portal: it subtracts **30 XP** as a penalty when activated, rendered in a dark red/purple with a glitch-flicker animation. XP is floored at 0 — activating the System Glitch when already at 0 XP has no further effect. The System Glitch does not trigger badge unlocks or level-ups, and its XP hint shows "−30 XP penalty" rather than a positive reward. A high-contrast animated progress bar at the top of the screen shows current XP progress toward the next level threshold (500 XP). When the bar fills, a full-screen **LEVEL UP** overlay fires — complete with a burst of green confetti powered by `canvas-confetti` — and the player's level increments permanently. The system tracks both per-level XP (which resets on level-up) and lifetime total XP (which never resets and drives XP-based badge unlocks).

### Badge Room
Nine achievement badges are displayed in a grid at the bottom of the dashboard. Locked badges render in greyscale at reduced opacity. When a badge condition is met, it unlocks instantly: full colour returns, a neon green glow appears around the card, and a toast notification announces the unlock. Badges reward a mix of milestones — first quest completion, reaching specific levels, accumulating lifetime XP, and the ultimate **Prestige** achievement.

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
| ✨ Prestige | Prestige at least once after reaching XP God |

### Prestige System

Once a player earns the **⚡ XP God** badge (5,000 total XP), a gold **✨ PRESTIGE NOW** button appears on the dashboard, framed in a glowing gold card. Clicking it triggers a confirmation dialog, then resets the player's current XP and Level back to 1 — while permanently preserving their Total XP and all earned badges. A `prestigeCount` column on `user_progress` tracks how many times the player has prestiged.

After prestiging, a full-screen **PRESTIGE!** overlay fires with a double burst of gold and white confetti (powered by `canvas-confetti`). The header gains a gold **✨ Prestige N** badge next to the level indicator, showing the prestige tier at a glance. Players can prestige multiple times — the overlay uses ordinal numbering ("1st Prestige Achieved!", "2nd Prestige Achieved!", etc.).

The prestige gate is enforced on the server: the `progress.prestige` tRPC procedure checks for the `xp_5000` badge before calling `prestigeUser()`, and throws a `FORBIDDEN` error if the condition is not met.

### XP Breakdown — Today vs All-Time

The welcome banner and stats footer both surface a clear split between **XP earned today** and **lifetime Total XP**, so the player can see both their daily effort and their long-term achievement at a glance.

In the welcome banner, two labelled pills sit side-by-side in the top-right corner. The bright **TODAY / XP EARNED** pill shows the sum of positive XP quests completed since midnight (e.g. `+150`). The darker **ALL-TIME / TOTAL XP** pill shows the cumulative lifetime total that never resets (e.g. `4,250`). The TODAY pill uses a brighter neon green border to draw the eye first.

The stats footer below the quest list has expanded from three cards to four: **⭐ Level**, **🌟 Today's XP**, **⚡ Total XP**, and **🏆 Badges**. The Today's XP card also uses a brighter border to visually distinguish it from the all-time figure.

The `xpToday` value is computed server-side in the `progress.get` tRPC procedure by cross-referencing today's completed quest keys with the `QUESTS` constant. Only positive-XP quests are counted — System Glitch penalties are deliberately excluded, since a penalty is not "earned" XP.

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
│   ├── db.ts                   # Database query helpers (incl. uncompleteQuest, subtractXp, penaltyXp, prestigeUser)
│   ├── levelup.test.ts         # 39 feature tests (incl. quest undo, prestige, Offline Buff, System Glitch)
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
user_progress    — Per-user XP, level, totalXp, and prestigeCount
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

The project ships with **39 Vitest tests** covering all critical paths:

```bash
pnpm test
```

Test coverage includes registration validation (duplicate usernames, password length, special characters), login authentication, quest listing and completion, XP award logic, level-up detection at the 500 XP threshold, **quest undo logic** (XP subtraction, level-down handling, CONFLICT when not completed today), **prestige logic** (XP God gate, prestigeCount increment, FORBIDDEN error without badge), badge unlock conditions, the session cookie lifecycle, **Offline Buff logic** (+80 XP award, level-up trigger, CONFLICT guard), and **System Glitch logic** (−30 XP via `penaltyXp`, floor-at-0 guarantee, no badge unlock, no level-up). All tests mock the database layer and the session SDK so they run without a live database connection.

---

## Customisation

The portal is designed to be easily adapted. The most common customisations are:

**Change quest names or descriptions** — Edit the `QUESTS` array in `server/routers.ts`. Each quest has a `key`, `label`, `description`, `icon`, `xp`, and `variant` field. The `variant` field controls the visual style: `"normal"` (default green), `"legendary"` (pulsing neon glow, higher XP), or `"glitch"` (red/purple, negative XP penalty).

**Adjust XP per quest or XP to level up** — Change the `xp` value on individual quests in `QUESTS`, or change the `XP_PER_LEVEL` constant in `server/db.ts` (currently `500`).

**Add new badges** — Add an entry to the `BADGES` array in `server/routers.ts` and add the corresponding unlock condition to `checkAndUnlockBadges()` in `server/db.ts`.

**Change the colour scheme** — Edit the CSS variables in `client/src/index.css`. All colours use OKLCH format. The primary neon green is `oklch(0.72 0.22 142)`.

---

## Architecture Notes

**Why tRPC?** All client–server communication goes through tRPC procedures, which means the TypeScript types defined on the server are automatically available in the frontend with no manual contract files or code generation step. Adding a new feature means writing one procedure in `server/routers.ts` and calling `trpc.feature.useQuery()` in the component — nothing else.

**Why local auth instead of OAuth?** The target user (a 10-year-old) does not have a Manus or Google account. Local username/password auth with bcrypt is the most accessible option. The implementation uses the same session cookie infrastructure as the OAuth flow, so both can coexist if needed.

**xpToday calculation** — `xpToday` is computed in `progress.get` by calling `getTodayCompletedQuests(userId)` (which returns today's completed quest keys) and then reducing over the `QUESTS` constant to sum only the positive-XP entries. System Glitch completions are in the database but their `xp < 0` value means they are skipped in the sum. This keeps the "earned today" figure honest — it reflects genuine positive effort, not net XP after penalties.

**Why SQL `DATE` for quest completions?** Storing a `TIMESTAMP` and comparing with `DATE()` in SQL would work, but constructing the comparison date from `new Date().toISOString()` introduces a UTC offset that shifts the date backward for users in UTC+ timezones, causing quests completed in the evening to appear as "already completed" the next morning. Using a `DATE` column populated with `new Date(year, month, day)` (local time components) eliminates this class of bug entirely.

**Optimistic updates** — Both quest completion and quest undo use the `onMutate` / `onError` / `onSettled` tRPC mutation pattern. The quest card flips state instantly on click; if the server returns an error, the cache rolls back automatically. This makes the UI feel instantaneous even on slow connections.

**Quest undo design** — The undo flow mirrors the complete flow in reverse: `uncompleteQuest()` deletes the `user_quests` record for today, then `subtractXp()` decrements the XP. If the subtraction would push `xp` below zero and the player is above Level 1, the system borrows from the previous level (`newXp = XP_PER_LEVEL + newXp`) and decrements the level. At Level 1, XP is clamped to 0 rather than going negative. `totalXp` (lifetime earnings) is also decremented but never goes below 0.

**Negative XP quest design (System Glitch)** — Quests with `xp < 0` in the QUESTS array take a separate code path in `quest.complete`: instead of calling `addXp()`, the procedure calls `penaltyXp(userId, amount)`. The `penaltyXp` helper decrements `xp` (current-level XP) but clamps it at 0 — it never goes negative and never triggers a level-down. It also does not modify `totalXp` (lifetime earnings), since a penalty is not a real achievement. Badge checks and level-up checks are skipped entirely for negative XP quests. The Undo button on a System Glitch card restores the 30 XP via the standard `subtractXp` path in reverse (i.e. `addXp` is called with 30).

**Prestige design** — `prestigeUser()` resets `xp` and `level` to 1 and increments `prestigeCount`, but deliberately leaves `totalXp` untouched. This means all XP-based badge thresholds remain unlocked after a prestige, and the player's lifetime achievement is preserved. The prestige gate (`badges.includes("xp_5000")`) is checked server-side in the `progress.prestige` tRPC procedure, not client-side, so it cannot be bypassed by manipulating the UI.

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
