# CLAUDE.md — The Level Up Portal: Project Brain

> This file is the authoritative reference for Claude Code (and any AI coding assistant) working on this project. Read it fully before making any changes.

---

## Project Goal

**The Level Up Portal** is a gamified daily achievement tracker designed for a 10-year-old user. It motivates the completion of real-world tasks (chores, homework, reading) through a video-game reward loop: completing tasks earns XP, XP fills a progress bar, and filling the bar triggers a level-up celebration. The aesthetic is directly inspired by **Roblox** — chunky, colourful, and immediately legible to a young player.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | React 19 + TypeScript | Vite dev server, Wouter for routing |
| **Styling** | Tailwind CSS 4 + custom CSS classes | OKLCH colour format required (not HSL) |
| **UI Components** | shadcn/ui + Radix UI primitives | Import from `@/components/ui/*` |
| **API Layer** | tRPC 11 (type-safe RPC) | All backend calls go through `trpc.*` hooks — never raw fetch |
| **Backend** | Express 4 + Node.js (tsx watch) | Entry: `server/_core/index.ts` |
| **Database** | MySQL / TiDB (via Drizzle ORM) | Schema: `drizzle/schema.ts` |
| **Auth** | Local username + password (bcryptjs) | Session cookies via `sdk.createSessionToken` from `server/_core/sdk` |
| **Animations** | canvas-confetti + Framer Motion | Confetti fires on level-up; Framer Motion for micro-interactions |
| **Testing** | Vitest | Test files: `server/*.test.ts` |
| **Package Manager** | pnpm | Always use `pnpm`, never `npm` or `yarn` |

---

## CLI Commands

```bash
# Start the development server (frontend + backend on port 3000)
pnpm dev

# Run all tests
pnpm test

# Type-check without emitting
pnpm check

# Generate Drizzle migration SQL from schema changes
pnpm drizzle-kit generate

# Install a new package
pnpm add <package-name>

# Install a dev dependency
pnpm add -D <package-name>

# Build for production
pnpm build
```

> **Never** use `npm install` or `yarn add`. The project uses pnpm workspaces and a lockfile that only pnpm understands.

---

## UI Guidelines — "Ninja Turtle Green" Design System

### Colour Palette

All colours use **OKLCH format** (required by Tailwind CSS 4). Do not substitute hex or HSL values in CSS variables.

| Role | OKLCH | Hex Equivalent | Usage |
|---|---|---|---|
| **Neon Lime (Primary)** | `oklch(0.72 0.22 142)` | `#32CD32` | Buttons, active states, XP bar fill, badge glow |
| **Deep Forest (Secondary)** | `oklch(0.35 0.15 142)` | `#006400` | Button shadows, panel borders, header backgrounds |
| **Dark Slate (Background)** | `oklch(0.09 0.02 145)` | `#121212` | Page background |
| **Surface** | `oklch(0.13 0.04 142)` | `#1a1f1a` | Cards and panels |
| **Text Primary** | `oklch(0.97 0.01 145)` | `#f0fff0` | Main readable text |
| **Text Muted** | `oklch(0.55 0.05 145)` | `#6b8c6b` | Subtitles, labels |

### Typography

- **Bangers** (Google Font) — used for all headings, the logo, level-up text, and any "game title" copy. Always add `letter-spacing: 0.05em`.
- **Fredoka** (Google Font) — used for all body text, button labels, descriptions, and form inputs.

Both fonts are loaded in `client/index.html` via Google Fonts CDN.

### Roblox-Style Button Rules

Buttons must feel **chunky and 3D**. The `.roblox-btn` CSS class in `client/src/index.css` implements this. Key properties:

- Thick bottom border shadow (`box-shadow: 0 5px 0 <dark-green>`) to simulate a raised block
- On `:hover` — translate up 2px and scale to 1.03 (grows slightly)
- On `:active` — translate down 3px and scale to 0.97 (squishes into the surface)
- Transition duration: `0.08s` (snappy, game-like)
- Border radius: `10px` minimum; cards use `16px`

**Never** use flat, borderless, or shadow-free buttons in this project. Every interactive element should feel physically pressable.

**Button colour variants** defined in `client/src/index.css`:

| Class | Colour | Usage |
|---|---|---|
| `.roblox-btn` (default) | Neon Lime green | Complete quest, primary CTAs |
| `.roblox-btn-secondary` | Dark forest green | Logout, secondary actions |
| `.roblox-btn-danger` | Red-orange | Destructive actions |
| `.roblox-btn-undo` | Amber/orange | Undo quest completion (signals reversible action) |
| `.roblox-btn-legendary` | Gold/green gradient + pulsing glow | Legendary quests (e.g. Offline Buff) |
| `.roblox-btn-glitch` | Dark red/purple + flicker animation | Negative XP penalty quests (e.g. System Glitch) |

The amber colour for `.roblox-btn-undo` is intentional — it is visually distinct from the green Complete button so the player immediately understands it reverses an action rather than completing one. The `.roblox-btn-glitch` is the **only non-green button** in the entire portal — this visual isolation communicates danger and corruption to the player.

### Badge Room Rules

- All badges render with `.badge-item` class — **grayscale, 50% opacity** when locked.
- Add `.unlocked` class when `badge.unlocked === true` — removes grayscale, restores opacity, adds a neon green `box-shadow` glow.
- Never show a "locked" text label — the visual greyscale treatment communicates the state.

---

## Logic Flow

### Authentication

1. User visits `/register` → submits username (3–20 chars, alphanumeric + underscores) and password (6–64 chars).
2. Server hashes password with `bcrypt` (12 rounds) and stores in `users.passwordHash`.
3. A synthetic `openId` (`local_<username>_<timestamp>`) is created so the local user integrates with the existing OAuth session infrastructure.
4. `sdk.createSessionToken(openId, { name, expiresInMs: 7d })` creates a signed JWT stored as an HTTP-only session cookie.
5. Login follows the same flow: `bcrypt.compare` → new session token → cookie set.
6. `useAuth()` hook reads the session; `ctx.user` is available in all `protectedProcedure` calls.

### XP & Levelling

```
Quest completed (standard, xp > 0)
  → completeQuest(userId, questKey)   // returns false if already done today
  → addXp(userId, quest.xp)           // e.g. 50 for standard, 80 for Offline Buff
      xp += amount
      totalXp += amount
      if xp >= 500:
          xp -= 500        // carry-over XP, does NOT reset to 0
          level += 1
          leveledUp = true
  → checkAndUnlockBadges(userId)
  → return { xpGained: quest.xp, xp, level, leveledUp, newLevel, newBadges }

Quest completed (glitch, xp < 0 e.g. System Glitch = -30)
  → completeQuest(userId, questKey)   // returns false if already activated today
  → penaltyXp(userId, Math.abs(quest.xp))  // e.g. penaltyXp(userId, 30)
      xp = max(0, xp - amount)         // floor at 0, never negative
      totalXp unchanged                // penalty does NOT affect lifetime XP
      level unchanged                  // no level-down on penalty
  → NO badge check, NO level-up check
  → return { xpGained: -30, xp, level, leveledUp: false, newBadges: [] }

Quest undone (Undo button clicked)
  → uncompleteQuest(userId, questKey)  // deletes today's record; returns false if not found
  → subtractXp(userId, quest.xp)       // for standard quests; for glitch quests, addXp is called
      xp -= 50
      if xp < 0 and level > 1:
          level -= 1
          xp = XP_PER_LEVEL + xp   // borrow from previous level (e.g. -10 → 490)
          leveledDown = true
      if xp < 0 and level == 1:
          xp = 0                   // clamp at floor, never negative
      totalXp = max(0, totalXp - 50)
  → return { xpLost: quest.xp, xp, level, leveledDown }
```

- **XP per quest:** 50 for standard quests, **80 for Offline Buff (legendary)**, **−30 for System Glitch (glitch)**

**Full Quest Reference (as of current build):**

| Key | Label | XP | Variant | Description |
|---|---|---|---|---|
| `daily_grind` | Daily Grind | +50 | normal | Start your day strong! Complete your morning routine. |
| `homework_quest` | Homework Quest | +50 | normal | Conquer your homework and level up your brain! |
| `room_recon` | Household Chores | +50 | normal | Doing chores and helping mum and dad. |
| `reading_mission` | Reading Mission | +50 | normal | Read for at least 20 minutes today. |
| `custom_training` | Controlling Anger | +50 | normal | Keep your cool, hero! No shouting, no rudeness — breathe deep, stay calm, and show everyone your superpower! 🧘 |
| `offline_buff` | Power Down: The Offline Buff | +80 | legendary | Completed at least 1 hour of screen-free time. |
| `system_glitch` | System Glitch | −30 | glitch | A corruption in the system. Activate at your own risk! |

> Note: The database key (`questKey`) never changes — only the `label` and `description` in the `QUESTS` constant in `server/routers.ts` need updating when renaming a quest.
- **XP to level up:** 500 (configurable via `XP_PER_LEVEL` in `server/db.ts`)
- **`xp`** tracks progress within the current level (0–499); resets on level-up.
- **`xpToday`** is computed on-the-fly in `progress.get` — it is NOT stored in the database. It sums the `xp` values of today's completed quests (from `getTodayCompletedQuests`) where `quest.xp > 0`. System Glitch completions are present in the database but excluded from this sum because their `xp < 0`. This keeps the "earned today" figure honest.
- **`totalXp`** is the lifetime cumulative total; used for XP-based badge thresholds. Never resets. Penalty quests do not modify `totalXp`.
- **Undo is day-scoped** — only quests completed *today* can be undone. Attempting to undo a quest from a previous day returns a CONFLICT error.
- **Quest `variant` field** controls both the visual style and the XP code path: `"normal"` → standard green + `addXp`, `"legendary"` → pulsing glow + `addXp` (higher amount), `"glitch"` → red/purple + `penaltyXp` (no badge/level-up).

### Prestige System

```
Prestige triggered (player has xp_5000 badge)
  → progress.prestige() procedure
      → getUserBadges(userId) → check for "xp_5000"
      → if not found: throw FORBIDDEN ("Earn the XP God badge first")
      → prestigeUser(userId)
            xp = 1
            level = 1
            prestigeCount += 1
            totalXp unchanged   ← all XP-based badges remain unlocked
      → unlock "prestige" badge if not already owned
      → return { success: true, prestigeCount }
```

- **Prestige gate** is enforced **server-side** in `progress.prestige` — never trust the client to gate this.
- **`totalXp` is never reset** — this ensures all XP-based badges (XP Hunter, XP Master, The Grinder, XP God) stay unlocked across prestiges.
- **`prestigeCount`** is stored on `user_progress` and displayed in the dashboard header as a gold **✨ Prestige N** badge.
- **Prestige animation** — when `progress.prestige` returns, the Dashboard sets `showPrestige = true`, rendering `<PrestigeOverlay>` which fires gold + white `canvas-confetti` in two bursts and auto-dismisses after 6 seconds.
- **Ordinal numbering** — the overlay uses `ordinal(n)` helper to display "1st Prestige Achieved!", "2nd Prestige Achieved!", etc.

### Daily Quest Reset

Quests reset every day at midnight (local time). The `user_quests` table stores a `completedDate` column as SQL `DATE` type. Completion checks use `DATE(completedDate) = DATE(?)` comparison. The date value is always constructed as `new Date(year, month, day)` using local date components — **never** `new Date().toISOString().split('T')[0]` — to avoid UTC timezone drift.

### Level-Up Animation

When `quest.complete` returns `leveledUp: true`, the Dashboard sets `showLevelUp = true` in React state. This renders a full-screen `<LevelUpOverlay>` component that:
1. Fires `canvas-confetti` with green colour palette on mount.
2. Displays "LEVEL UP!" in Bangers font with a neon green glow.
3. Auto-dismisses after 4 seconds, or immediately on click.

---

## File Map

```
level-up-portal/
├── client/
│   ├── index.html              ← Google Fonts CDN links live here
│   └── src/
│       ├── index.css           ← ALL custom CSS (roblox-btn, xp-bar, badge-item, etc.)
│       ├── App.tsx             ← Route definitions (/, /login, /register, /dashboard)
│       └── pages/
│           ├── Home.tsx        ← Landing page with CTAs
│           ├── Login.tsx       ← Login form
│           ├── Register.tsx    ← Register form
│           └── Dashboard.tsx   ← Main game screen (XP bar, quests, badge room)
├── server/
│   ├── routers.ts              ← tRPC procedures + QUESTS/BADGES constants (exported)
│   ├── db.ts                   ← All database query helpers (incl. uncompleteQuest, subtractXp, penaltyXp, prestigeUser, getXpHistory)
│   ├── levelup.test.ts         ← 44 feature tests (auth, quests, XP, undo, prestige, Offline Buff, System Glitch, xpToday, xpHistory)
│   └── auth.logout.test.ts     ← Template logout test (updated for dual-cookie logout)
├── drizzle/
│   └── schema.ts               ← Database table definitions (source of truth)
├── shared/
│   └── const.ts                ← COOKIE_NAME and other shared constants
└── CLAUDE.md                   ← This file
```

---

## Database Schema Summary

| Table | Key Columns | Purpose |
|---|---|---|
| `users` | `id`, `openId`, `username`, `passwordHash`, `name`, `role` | User accounts (local + OAuth) |
| `user_progress` | `userId`, `xp`, `level`, `totalXp`, `prestigeCount` | Per-user XP, level, and prestige state |
| `user_quests` | `userId`, `questKey`, `completedDate` | Daily quest completion records |
| `user_badges` | `userId`, `badgeKey`, `unlockedAt` | Earned badge records |

To modify the schema: edit `drizzle/schema.ts` → run `pnpm drizzle-kit generate` → read the generated `.sql` file → apply via `webdev_execute_sql`.

---

## Adding New Features — Checklist

When adding any new feature, follow this order:

1. Update `drizzle/schema.ts` if new tables or columns are needed; generate and apply migration.
2. Add query helpers to `server/db.ts`.
3. Add tRPC procedures to `server/routers.ts` (use `protectedProcedure` for anything requiring login).
4. Build the UI in `client/src/pages/` using `trpc.*.useQuery` / `trpc.*.useMutation`.
5. Use **optimistic updates** (`onMutate` / `onError` / `onSettled`) for any toggle or list mutation.
6. Add vitest tests in `server/*.test.ts`.
7. Verify TypeScript: `pnpm check` must return 0 errors.

**When adding a new XP display metric (like xpToday):**
- Compute it server-side in `progress.get` by joining existing data (e.g. `getTodayCompletedQuests` + `QUESTS` constant). Do NOT add a new database column unless the value cannot be derived.
- Return it alongside `xp`, `level`, and `totalXp` in the `progress.get` response.
- Display it prominently in the welcome banner (pill/badge) AND in the stats footer card.
- Use a visually distinct border or colour to differentiate "today" from "all-time" at a glance.
- Exclude penalty/negative-XP actions from "earned" metrics — they are not achievements.

**When adding a time-series chart (like the 7-day XP history):**
- Add a dedicated `get*History(userId)` helper in `server/db.ts` that queries the relevant table, groups by date, and returns an array of `{ date: string, value: number }` objects.
- Add a dedicated `progress.*History` tRPC `protectedProcedure` in `server/routers.ts` — do NOT fold it into `progress.get` to keep the response payload small.
- Use **Recharts** (already in the project) for all chart rendering. Import `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer` from `recharts`.
- Apply the TMNT colour palette: today's bar = `#32CD32` (neon lime), past days with data = `#228B22` (medium green), zero-XP days = `#1a2a1a` (dark surface). Never use default Recharts blue.
- Always include an empty-state message (e.g. "No XP earned this week yet") when the data array is empty or all values are zero.
- Write tests for: correct array length, per-day values, zero-day handling, empty array, and auth guard.

**When adding a reversible action (like the quest undo):**
- Add a `remove`/`delete` DB helper that is day-scoped or otherwise guarded against accidental data loss.
- Add a corresponding `subtract`/`decrement` helper with floor-clamping logic.
- Add the tRPC procedure and mirror the optimistic update pattern from `quest.uncomplete` in `routers.ts`.
- Use `.roblox-btn-undo` (amber) for the undo button so it is visually distinct from the primary action.

**When adding a new quest type:**
- Add an entry to the `QUESTS` array in `server/routers.ts` with a unique `key`, `label`, `description`, `icon`, `xp`, and `variant` field.
- `variant: "normal"` — standard green button, `addXp` path.
- `variant: "legendary"` — pulsing glow button (`.roblox-btn-legendary`), `addXp` path with higher XP value.
- `variant: "glitch"` — red/purple button (`.roblox-btn-glitch`), `penaltyXp` path, no badge/level-up checks, XP floored at 0.
- The `quest.complete` procedure in `routers.ts` branches on `quest.xp < 0` to call `penaltyXp` instead of `addXp`.
- Add corresponding tests for the new quest's XP value, variant, and any special behaviour.

**When adding a prestige-style reset:**
- Always gate the action server-side (check a badge or threshold) — never trust the client.
- Decide which fields reset (XP, level) and which are preserved (`totalXp`, badges, `prestigeCount`).
- Add a counter column to track how many times the action has been taken.
- Fire a distinct animation (gold confetti vs. green confetti) so the player knows this is a special event.

---

## Common Pitfalls to Avoid

**Do not** store images or media files in `client/public/` or `client/src/assets/` — this causes deployment timeouts. Use `manus-upload-file --webdev` to get a CDN URL instead.

**Do not** use `npm` or `yarn` — always `pnpm`.

**Do not** hardcode the port number in server code — the deployment environment injects `PORT` via environment variable.

**Do not** use HSL colour values in Tailwind 4 `@theme` blocks — use OKLCH.

**Do not** create nested `<a>` tags inside Wouter `<Link>` components — `Link` already renders an `<a>` internally.

**Do not** call `setState` or navigation functions in the render phase — wrap in `useEffect`.
