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
- [ ] Add uncompleteQuest DB helper (delete today's quest record)
- [ ] Add subtractXp DB helper (subtract XP, handle level-down if XP goes negative)
- [ ] Add quest.uncomplete tRPC procedure
- [ ] Update Dashboard UI: completed quest shows "Undo" button to toggle back to incomplete
- [ ] Optimistic update for uncomplete action
- [ ] Write tests for uncomplete flow
- [ ] Push to GitHub and save checkpoint

## Prestige System
- [ ] Add `prestigeCount` column to `user_progress` table
- [ ] Add `prestige` DB helper (reset XP/level, increment prestigeCount, unlock prestige badge)
- [ ] Add `progress.prestige` tRPC procedure (protected, requires XP God badge)
- [ ] Show PRESTIGE button on Dashboard when XP God badge is unlocked
- [ ] Show prestige counter (e.g. "✦ Prestige II") in header next to level
- [ ] Add gold prestige badge to BADGES constant
- [ ] Add prestige animation/overlay (gold confetti burst)
- [ ] Write prestige vitest tests
- [ ] Update README.md and CLAUDE.md with prestige docs
- [ ] Push to GitHub and save checkpoint
