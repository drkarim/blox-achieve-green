# The Level Up Portal - TODO

## Backend
- [x] Database schema: users table with username/password/xp/level
- [x] Database schema: user_quests table for daily quest completion tracking
- [x] Database schema: user_badges table for badge unlock tracking
- [x] Auth procedures: register (hashed password), login, logout, me
- [x] Quest procedures: get quests, complete quest (+50 XP)
- [x] XP/Level procedures: get progress, handle level-up at 500 XP
- [x] Badge procedures: get badges, unlock badge logic
- [x] Daily quest reset logic (quests reset each day)

## Frontend
- [x] Global theme: Fredoka font, dark slate (#121212) background, neon green palette
- [x] Roblox-style CSS: chunky 3D buttons, thick borders, rounded corners
- [x] Login page with username/password form
- [x] Register page with username/password form
- [x] Dashboard layout with "Welcome back, [Username]!" header
- [x] XP progress bar at top of screen (high-contrast)
- [x] Level display alongside XP bar
- [x] Five quest cards: Daily Grind, Homework Quest, Room Recon, Reading Mission, Custom Training
- [x] Chunky green Complete buttons on each quest card
- [x] Completed state styling for quest cards (greyed out / checkmark)
- [x] Level-up animation with green confetti
- [x] Badge Room section at bottom with grayscale/neon-green icons
- [x] Hover effects: button squish/grow animations
- [x] Responsive design

## Testing
- [x] Auth register/login vitest tests
- [x] Quest completion vitest tests
- [x] XP/level-up logic vitest tests

## Quest Undo Feature
- [x] Add uncompleteQuest DB helper (delete today's quest record)
- [x] Add subtractXp DB helper (subtract XP, handle level-down if XP goes negative)
- [x] Add quest.uncomplete tRPC procedure
- [x] Update Dashboard UI: completed quest shows "↩ Undo" button to toggle back to incomplete
- [x] Optimistic update for uncomplete action
- [x] Write tests for uncomplete flow
- [x] Push to GitHub and save checkpoint

## Prestige System
- [x] Add `prestigeCount` column to `user_progress` table
- [x] Add `prestige` DB helper (reset XP/level, increment prestigeCount, unlock prestige badge)
- [x] Add `progress.prestige` tRPC procedure (protected, requires XP God badge)
- [x] Show PRESTIGE button on Dashboard when XP God badge is unlocked
- [x] Show prestige counter (e.g. "✨ Prestige N") in header next to level
- [x] Add gold prestige badge to BADGES constant
- [x] Add prestige animation/overlay (gold confetti burst)
- [x] Write prestige vitest tests
- [x] Update README.md and CLAUDE.md with prestige docs
- [x] Push to GitHub and save checkpoint

## New Quest Types
- [x] Add "Power Down: The Offline Buff" quest (+80 XP, legendary pulsing glow) to QUESTS constant
- [x] Add "System Glitch" quest (-30 XP, red/purple button, floor-clamped at 0) to QUESTS constant
- [x] Handle negative XP quest logic in backend (floor-clamping at 0, penaltyXp helper)
- [x] Add legendary-glow CSS class for Offline Buff card
- [x] Add glitch-btn CSS class (red/dark-purple) for System Glitch card
- [x] Update quest card rendering to handle negative XP display and special styles
- [x] Write tests for both new quest types
- [x] Update README.md and CLAUDE.md with new quest type documentation
- [x] Update roblox-green-portal-architect skill with new logic types
- [x] Push to GitHub and save checkpoint

## XP Breakdown (Today vs All-Time)
- [x] Add xpToday calculation to progress.get (sum XP from today's completed positive quests)
- [x] Update welcome banner: split into TODAY/ALL-TIME two-pill breakdown
- [x] Update stats footer: 4 cards — Level, Today's XP, Total XP, Badges
- [x] Update README.md, CLAUDE.md, and skill with xpToday feature
- [x] Push to GitHub and save checkpoint
