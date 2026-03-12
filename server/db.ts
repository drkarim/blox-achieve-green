import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, userBadges, userProgress, userQuests, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLocalUser(username: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `local_${username}_${Date.now()}`;
  await db.insert(users).values({
    openId,
    username,
    passwordHash,
    name: username,
    loginMethod: "local",
    lastSignedIn: new Date(),
  });
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Progress helpers ─────────────────────────────────────────────────────────

export async function getUserProgress(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1);
  if (result.length > 0) return result[0];
  // Auto-create progress row
  await db.insert(userProgress).values({ userId, xp: 0, level: 1, totalXp: 0 });
  const created = await db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1);
  return created[0] ?? null;
}

export async function addXp(userId: number, amount: number): Promise<{ xp: number; level: number; leveledUp: boolean; newLevel: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const progress = await getUserProgress(userId);
  if (!progress) throw new Error("Progress not found");

  const XP_PER_LEVEL = 500;
  let newXp = progress.xp + amount;
  let newLevel = progress.level;
  let leveledUp = false;

  if (newXp >= XP_PER_LEVEL) {
    newXp = newXp - XP_PER_LEVEL;
    newLevel = progress.level + 1;
    leveledUp = true;
  }

  const newTotalXp = progress.totalXp + amount;

  await db.update(userProgress)
    .set({ xp: newXp, level: newLevel, totalXp: newTotalXp })
    .where(eq(userProgress.userId, userId));

  return { xp: newXp, level: newLevel, leveledUp, newLevel };
}

// ─── Quest helpers ────────────────────────────────────────────────────────────

// Get today's date as a Date object at local midnight (avoids UTC offset issues)
function getTodayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function getTodayCompletedQuests(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const today = getTodayDate();
  const result = await db.select().from(userQuests)
    .where(and(
      eq(userQuests.userId, userId),
      sql`DATE(${userQuests.completedDate}) = DATE(${today.toISOString().split('T')[0]})`
    ));
  return result.map(r => r.questKey);
}

export async function completeQuest(userId: number, questKey: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const today = getTodayDate();
  const todayStr = today.toISOString().split('T')[0];
  // Check if already completed today
  const existing = await db.select().from(userQuests)
    .where(and(
      eq(userQuests.userId, userId),
      eq(userQuests.questKey, questKey),
      sql`DATE(${userQuests.completedDate}) = DATE(${todayStr})`
    ));
  if (existing.length > 0) return false; // already done
  // Store as local date (not UTC midnight) to avoid timezone shift
  await db.insert(userQuests).values({ userId, questKey, completedDate: today });
  return true;
}

export async function uncompleteQuest(userId: number, questKey: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const today = getTodayDate();
  const todayStr = today.toISOString().split('T')[0];
  // Only delete if it was actually completed today
  const existing = await db.select().from(userQuests)
    .where(and(
      eq(userQuests.userId, userId),
      eq(userQuests.questKey, questKey),
      sql`DATE(${userQuests.completedDate}) = DATE(${todayStr})`
    ));
  if (existing.length === 0) return false; // wasn't completed today
  await db.delete(userQuests)
    .where(and(
      eq(userQuests.userId, userId),
      eq(userQuests.questKey, questKey),
      sql`DATE(${userQuests.completedDate}) = DATE(${todayStr})`
    ));
  return true;
}

export async function subtractXp(userId: number, amount: number): Promise<{ xp: number; level: number; leveledDown: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const progress = await getUserProgress(userId);
  if (!progress) throw new Error("Progress not found");

  const XP_PER_LEVEL = 500;
  let newXp = progress.xp - amount;
  let newLevel = progress.level;
  let leveledDown = false;

  // If XP goes negative, borrow from the previous level
  if (newXp < 0 && newLevel > 1) {
    newLevel = progress.level - 1;
    newXp = XP_PER_LEVEL + newXp; // e.g. -10 → 490
    leveledDown = true;
  } else if (newXp < 0) {
    // Already at level 1 — clamp to 0, don't go negative
    newXp = 0;
  }

  // totalXp tracks lifetime earnings — subtract but never go below 0
  const newTotalXp = Math.max(0, progress.totalXp - amount);

  await db.update(userProgress)
    .set({ xp: newXp, level: newLevel, totalXp: newTotalXp })
    .where(eq(userProgress.userId, userId));

  return { xp: newXp, level: newLevel, leveledDown };
}

/**
 * penaltyXp: applies a negative-XP penalty (e.g. System Glitch quest).
 * - Subtracts from current-level xp, floored at 0 (never goes negative).
 * - Also subtracts from totalXp (all-time total), floored at 0.
 * - Does NOT trigger level-down (it's a penalty, not an undo).
 */
export async function penaltyXp(userId: number, amount: number): Promise<{ xp: number; level: number; totalXp: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const progress = await getUserProgress(userId);
  if (!progress) throw new Error("Progress not found");

  // Floor at 0 — penalty cannot push XP below zero
  const newXp = Math.max(0, progress.xp - amount);
  const newTotalXp = Math.max(0, progress.totalXp - amount);

  await db.update(userProgress)
    .set({ xp: newXp, totalXp: newTotalXp })
    .where(eq(userProgress.userId, userId));

  return { xp: newXp, level: progress.level, totalXp: newTotalXp };
}

// ─── Prestige helper ────────────────────────────────────────────────────────────────────────────────────

/**
 * Prestige: resets XP and level back to 1, increments prestigeCount.
 * totalXp is preserved (lifetime earnings, used for badge tracking).
 * Requires the player to have earned the xp_5000 (XP God) badge.
 * Returns the new prestigeCount.
 */
export async function prestigeUser(userId: number): Promise<{ prestigeCount: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const progress = await getUserProgress(userId);
  if (!progress) throw new Error("Progress not found");

  const newPrestigeCount = (progress.prestigeCount ?? 0) + 1;

  await db.update(userProgress)
    .set({ xp: 0, level: 1, prestigeCount: newPrestigeCount })
    .where(eq(userProgress.userId, userId));

  // Unlock the prestige badge (key: "prestige_1" for first prestige)
  await unlockBadge(userId, "prestige");

  return { prestigeCount: newPrestigeCount };
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

/**
 * Returns XP earned per day for the last 7 days (including today).
 * Each entry: { date: "YYYY-MM-DD", xp: number }
 * Only positive-XP quests are counted (glitch penalties excluded).
 */
export async function getXpHistory(
  userId: number,
  quests: { key: string; xp: number }[]
): Promise<{ date: string; xp: number }[]> {
  const db = await getDb();
  if (!db) return [];

  // Build the last 7 days as YYYY-MM-DD strings (local time)
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${day}`);
  }

  // Fetch all completions in the last 7 days for this user
  const rows = await db
    .select()
    .from(userQuests)
    .where(
      and(
        eq(userQuests.userId, userId),
        sql`DATE(${userQuests.completedDate}) >= ${days[0]}`
      )
    );

  // Build a lookup: date string → total XP earned that day (positive quests only)
  const xpByDay: Record<string, number> = {};
  for (const row of rows) {
    const rawDate = row.completedDate as unknown;
    const dateStr = typeof rawDate === "string"
      ? (rawDate as string).slice(0, 10)
      : new Date(rawDate as Date).toISOString().slice(0, 10);
    const quest = quests.find(q => q.key === row.questKey);
    if (quest && quest.xp > 0) {
      xpByDay[dateStr] = (xpByDay[dateStr] ?? 0) + quest.xp;
    }
  }

  return days.map(date => ({ date, xp: xpByDay[date] ?? 0 }));
}

export async function getUserBadges(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  return result.map(r => r.badgeKey);
}

export async function unlockBadge(userId: number, badgeKey: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeKey, badgeKey)));
  if (existing.length > 0) return false;
  await db.insert(userBadges).values({ userId, badgeKey });
  return true;
}

// Check and auto-unlock badges based on progress
export async function checkAndUnlockBadges(userId: number): Promise<string[]> {
  const progress = await getUserProgress(userId);
  if (!progress) return [];
  const existing = await getUserBadges(userId);
  const newBadges: string[] = [];

  const badgeRules: { key: string; condition: boolean }[] = [
    { key: "first_quest",   condition: progress.totalXp >= 50 },
    { key: "level_2",       condition: progress.level >= 2 },
    { key: "level_5",       condition: progress.level >= 5 },
    { key: "level_10",      condition: progress.level >= 10 },
    { key: "xp_500",        condition: progress.totalXp >= 500 },
    { key: "xp_1000",       condition: progress.totalXp >= 1000 },
    { key: "xp_5000",       condition: progress.totalXp >= 5000 },
    { key: "grinder",       condition: progress.totalXp >= 2500 },
  ];

  for (const rule of badgeRules) {
    if (rule.condition && !existing.includes(rule.key)) {
      await unlockBadge(userId, rule.key);
      newBadges.push(rule.key);
    }
  }
  return newBadges;
}
