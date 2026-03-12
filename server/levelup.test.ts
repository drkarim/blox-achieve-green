import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter, QUESTS, BADGES } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

// ─── Mock DB helpers ─────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserByUsername: vi.fn(),
  createLocalUser: vi.fn(),
  getUserProgress: vi.fn(),
  getTodayCompletedQuests: vi.fn(),
  completeQuest: vi.fn(),
  uncompleteQuest: vi.fn(),
  addXp: vi.fn(),
  subtractXp: vi.fn(),
  penaltyXp: vi.fn(),
  checkAndUnlockBadges: vi.fn(),
  getUserBadges: vi.fn(),
  prestigeUser: vi.fn(),
  getXpHistory: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-session-token"),
  },
}));

import * as db from "./db";

// ─── Test context factory ─────────────────────────────────────────────────────
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    openId: "local_testuser_123",
    name: "testuser",
    email: null,
    loginMethod: "local",
    role: "user",
    username: "testuser",
    passwordHash: "$2a$12$hashedpassword",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function createContext(user: User | null = null): TrpcContext {
  const cookies: Record<string, unknown> = {};
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, opts: unknown) => { cookies[name] = { value, opts }; },
      clearCookie: (name: string, opts: unknown) => { cookies[name] = null; },
    } as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: string[] = [];
    const ctx: TrpcContext = {
      user: createMockUser(),
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string) => { clearedCookies.push(name); },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toContain(COOKIE_NAME);
  });
});

describe("auth.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects duplicate usernames", async () => {
    vi.mocked(db.getUserByUsername).mockResolvedValue(createMockUser());
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.register({ username: "testuser", password: "password123" })
    ).rejects.toThrow("Username already taken");
  });

  it("creates a new user and returns success", async () => {
    vi.mocked(db.getUserByUsername).mockResolvedValue(undefined);
    vi.mocked(db.createLocalUser).mockResolvedValue(createMockUser());
    vi.mocked(db.getUserProgress).mockResolvedValue({ id: 1, userId: 1, xp: 0, level: 1, totalXp: 0, updatedAt: new Date() });
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.register({ username: "newuser", password: "password123" });
    expect(result.success).toBe(true);
    expect(result.user?.username).toBe("testuser");
  });

  it("rejects short passwords via zod", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.register({ username: "newuser", password: "abc" })
    ).rejects.toThrow();
  });

  it("rejects usernames with special characters via zod", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.register({ username: "bad user!", password: "password123" })
    ).rejects.toThrow();
  });
});

// ─── Quest Tests ──────────────────────────────────────────────────────────────
describe("quest.list", () => {
  it("returns all 7 quests with completion status", async () => {
    vi.mocked(db.getTodayCompletedQuests).mockResolvedValue(["daily_grind"]);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.list();
    expect(result).toHaveLength(7);
    expect(result.find(q => q.key === "daily_grind")?.completed).toBe(true);
    expect(result.find(q => q.key === "homework_quest")?.completed).toBe(false);
  });

  it("returns correct quest labels including new quests", async () => {
    vi.mocked(db.getTodayCompletedQuests).mockResolvedValue([]);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.list();
    const labels = result.map(q => q.label);
    expect(labels).toContain("Daily Grind");
    expect(labels).toContain("Homework Quest");
    expect(labels).toContain("Household Chores");
    expect(labels).toContain("Reading Mission");
    expect(labels).toContain("Controlling Anger");
    expect(labels).toContain("Power Down: The Offline Buff");
    expect(labels).toContain("System Glitch");
  });

  it("requires authentication", async () => {
    const ctx = createContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.quest.list()).rejects.toThrow();
  });
});

describe("quest.complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("awards +50 XP on quest completion", async () => {
    vi.mocked(db.completeQuest).mockResolvedValue(true);
    vi.mocked(db.addXp).mockResolvedValue({ xp: 50, level: 1, leveledUp: false, newLevel: 1 });
    vi.mocked(db.checkAndUnlockBadges).mockResolvedValue([]);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.complete({ questKey: "daily_grind" });
    expect(result.success).toBe(true);
    expect(result.xpGained).toBe(50);
    expect(db.addXp).toHaveBeenCalledWith(1, 50);
  });

  it("throws CONFLICT if quest already completed today", async () => {
    vi.mocked(db.completeQuest).mockResolvedValue(false);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.quest.complete({ questKey: "daily_grind" })
    ).rejects.toThrow("Quest already completed today");
  });

  it("throws NOT_FOUND for invalid quest key", async () => {
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.quest.complete({ questKey: "invalid_quest" })
    ).rejects.toThrow("Quest not found");
  });

  it("triggers level-up when XP reaches 500", async () => {
    vi.mocked(db.completeQuest).mockResolvedValue(true);
    vi.mocked(db.addXp).mockResolvedValue({ xp: 0, level: 2, leveledUp: true, newLevel: 2 });
    vi.mocked(db.checkAndUnlockBadges).mockResolvedValue(["level_2"]);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.complete({ questKey: "homework_quest" });
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(result.newBadges).toContain("level_2");
  });
});

// ─── Progress Tests ───────────────────────────────────────────────────────────
describe("progress.get", () => {
  it("returns user progress with XP and level", async () => {
    vi.mocked(db.getUserProgress).mockResolvedValue({ id: 1, userId: 1, xp: 150, level: 1, totalXp: 150, prestigeCount: 0, updatedAt: new Date() });
    vi.mocked(db.getUserBadges).mockResolvedValue(["first_quest"]);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.progress.get();
    expect(result.xp).toBe(150);
    expect(result.level).toBe(1);
    expect(result.totalXp).toBe(150);
    expect(result.xpToNextLevel).toBe(500);
    expect(result.badges).toContain("first_quest");
  });
});

// ─── Badge Tests ──────────────────────────────────────────────────────────────
describe("badge.list", () => {
  it("returns all 9 badges with unlock status", async () => {
    vi.mocked(db.getUserBadges).mockResolvedValue(["first_quest", "level_2"]);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.badge.list();
    expect(result).toHaveLength(9);
    expect(result.find(b => b.key === "first_quest")?.unlocked).toBe(true);
    expect(result.find(b => b.key === "level_2")?.unlocked).toBe(true);
    expect(result.find(b => b.key === "level_5")?.unlocked).toBe(false);
  });
});
// ─── Quest Uncomplete Tests ─────────────────────────────────────────────────────
describe("quest.uncomplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subtracts 50 XP when a quest is uncompleted", async () => {
    vi.mocked(db.uncompleteQuest).mockResolvedValue(true);
    vi.mocked(db.subtractXp).mockResolvedValue({ xp: 0, level: 1, leveledDown: false });
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.uncomplete({ questKey: "daily_grind" });
    expect(result.success).toBe(true);
    expect(result.xpLost).toBe(50);
    expect(db.subtractXp).toHaveBeenCalledWith(1, 50);
  });

  it("throws CONFLICT if quest was not completed today", async () => {
    vi.mocked(db.uncompleteQuest).mockResolvedValue(false);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.quest.uncomplete({ questKey: "daily_grind" })
    ).rejects.toThrow("Quest was not completed today");
  });

  it("throws NOT_FOUND for invalid quest key", async () => {
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.quest.uncomplete({ questKey: "invalid_quest" })
    ).rejects.toThrow("Quest not found");
  });

  it("reports leveledDown when XP subtraction causes level drop", async () => {
    vi.mocked(db.uncompleteQuest).mockResolvedValue(true);
    vi.mocked(db.subtractXp).mockResolvedValue({ xp: 450, level: 1, leveledDown: true });
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.uncomplete({ questKey: "homework_quest" });
    expect(result.leveledDown).toBe(true);
    expect(result.level).toBe(1);
  });

  it("requires authentication", async () => {
    const ctx = createContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.quest.uncomplete({ questKey: "daily_grind" })).rejects.toThrow();
  });
});

// ─── QUESTS/BADGES metadata ─────────────────────────────────────────────────────
describe("QUESTS constant", () => {
  it("has exactly 7 quests", () => {
    expect(QUESTS).toHaveLength(7);
  });

  it("standard quests award 50 XP", () => {
    const standard = QUESTS.filter(q => q.variant === "normal");
    standard.forEach(q => expect(q.xp).toBe(50));
  });

  it("Offline Buff awards 80 XP", () => {
    const buff = QUESTS.find(q => q.key === "offline_buff");
    expect(buff?.xp).toBe(80);
    expect(buff?.variant).toBe("legendary");
  });

  it("System Glitch subtracts 30 XP", () => {
    const glitch = QUESTS.find(q => q.key === "system_glitch");
    expect(glitch?.xp).toBe(-30);
    expect(glitch?.variant).toBe("glitch");
  });

  it("has the required quest names", () => {
    const labels = QUESTS.map(q => q.label);
    expect(labels).toContain("Daily Grind");
    expect(labels).toContain("Homework Quest");
    expect(labels).toContain("Household Chores");
    expect(labels).toContain("Reading Mission");
    expect(labels).toContain("Controlling Anger");
    expect(labels).toContain("Power Down: The Offline Buff");
    expect(labels).toContain("System Glitch");
  });
});

describe("BADGES constant", () => {
  it("has exactly 9 badges (including prestige)", () => {
    expect(BADGES).toHaveLength(9);
  });

  it("includes the prestige badge", () => {
    const keys = BADGES.map(b => b.key);
    expect(keys).toContain("prestige");
  });
});

// ─── Prestige Tests ────────────────────────────────────────────────────────────
describe("progress.prestige", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resets XP and level, increments prestigeCount", async () => {
    vi.mocked(db.getUserBadges).mockResolvedValue(["xp_5000"]);
    vi.mocked(db.prestigeUser).mockResolvedValue({ prestigeCount: 1 });
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.progress.prestige();
    expect(result.success).toBe(true);
    expect(result.prestigeCount).toBe(1);
    expect(db.prestigeUser).toHaveBeenCalledWith(1);
  });

  it("increments prestigeCount on subsequent prestiges", async () => {
    vi.mocked(db.getUserBadges).mockResolvedValue(["xp_5000", "prestige"]);
    vi.mocked(db.prestigeUser).mockResolvedValue({ prestigeCount: 2 });
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.progress.prestige();
    expect(result.prestigeCount).toBe(2);
  });

  it("throws FORBIDDEN if player does not have XP God badge", async () => {
    vi.mocked(db.getUserBadges).mockResolvedValue(["first_quest", "level_2"]);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    await expect(caller.progress.prestige()).rejects.toThrow("XP God status");
  });

  it("requires authentication", async () => {
    const ctx = createContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.progress.prestige()).rejects.toThrow();
  });
});

// ─── Offline Buff Tests (+80 XP) ──────────────────────────────────────────────
describe("quest.complete (offline_buff)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("awards +80 XP for the Offline Buff quest", async () => {
    vi.mocked(db.completeQuest).mockResolvedValue(true);
    vi.mocked(db.addXp).mockResolvedValue({ xp: 80, level: 1, leveledUp: false, newLevel: 1 });
    vi.mocked(db.checkAndUnlockBadges).mockResolvedValue([]);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.complete({ questKey: "offline_buff" });
    expect(result.success).toBe(true);
    expect(result.xpGained).toBe(80);
    expect(db.addXp).toHaveBeenCalledWith(1, 80);
  });

  it("can trigger level-up with the higher XP value", async () => {
    vi.mocked(db.completeQuest).mockResolvedValue(true);
    vi.mocked(db.addXp).mockResolvedValue({ xp: 80, level: 2, leveledUp: true, newLevel: 2 });
    vi.mocked(db.checkAndUnlockBadges).mockResolvedValue(["level_2"]);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.complete({ questKey: "offline_buff" });
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });

  it("throws CONFLICT if already completed today", async () => {
    vi.mocked(db.completeQuest).mockResolvedValue(false);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.quest.complete({ questKey: "offline_buff" })
    ).rejects.toThrow("Quest already completed today");
  });
});

// ─── System Glitch Tests (-30 XP) ─────────────────────────────────────────────
describe("quest.complete (system_glitch)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies -30 XP penalty via penaltyXp (not addXp)", async () => {
    vi.mocked(db.completeQuest).mockResolvedValue(true);
    vi.mocked(db.penaltyXp).mockResolvedValue({ xp: 20, level: 1, totalXp: 170 });
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.complete({ questKey: "system_glitch" });
    expect(result.success).toBe(true);
    expect(result.xpGained).toBe(-30);
    expect(db.penaltyXp).toHaveBeenCalledWith(1, 30);
    expect(db.addXp).not.toHaveBeenCalled();
  });

  it("does NOT trigger level-up for negative XP quest", async () => {
    vi.mocked(db.completeQuest).mockResolvedValue(true);
    vi.mocked(db.penaltyXp).mockResolvedValue({ xp: 0, level: 1, totalXp: 0 });
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.complete({ questKey: "system_glitch" });
    expect(result.leveledUp).toBe(false);
  });

  it("does NOT unlock badges for negative XP quest", async () => {
    vi.mocked(db.completeQuest).mockResolvedValue(true);
    vi.mocked(db.penaltyXp).mockResolvedValue({ xp: 20, level: 1, totalXp: 170 });
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.complete({ questKey: "system_glitch" });
    expect(result.newBadges).toHaveLength(0);
    expect(db.checkAndUnlockBadges).not.toHaveBeenCalled();
  });

  it("floors at 0 XP — never goes negative", async () => {
    vi.mocked(db.completeQuest).mockResolvedValue(true);
    // penaltyXp itself floors at 0 (tested in db.ts unit tests)
    vi.mocked(db.penaltyXp).mockResolvedValue({ xp: 0, level: 1, totalXp: 0 });
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.complete({ questKey: "system_glitch" });
    expect(result.xp).toBeGreaterThanOrEqual(0);
  });

  it("throws CONFLICT if already activated today", async () => {
    vi.mocked(db.completeQuest).mockResolvedValue(false);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.quest.complete({ questKey: "system_glitch" })
    ).rejects.toThrow("Quest already completed today");
  });
});


// ─── System Glitch Undo Tests ──────────────────────────────────────────────────
describe("quest.uncomplete (system_glitch)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restores +30 XP to both xp and totalXp when glitch is undone", async () => {
    vi.mocked(db.uncompleteQuest).mockResolvedValue(true);
    // Undoing a glitch uses addXp to restore the penalty
    vi.mocked(db.addXp).mockResolvedValue({ xp: 50, level: 1, leveledUp: false, newLevel: 1 });
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.uncomplete({ questKey: "system_glitch" });
    expect(result.success).toBe(true);
    // xpLost is -30 (the original quest.xp)
    expect(result.xpLost).toBe(-30);
    // addXp should be called with +30 to restore the penalty
    expect(db.addXp).toHaveBeenCalledWith(1, 30);
    // subtractXp must NOT be called for a glitch undo
    expect(db.subtractXp).not.toHaveBeenCalled();
  });

  it("throws CONFLICT if glitch was not activated today", async () => {
    vi.mocked(db.uncompleteQuest).mockResolvedValue(false);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.quest.uncomplete({ questKey: "system_glitch" })
    ).rejects.toThrow("Quest was not completed today");
  });
});

// ─── XP History Tests ──────────────────────────────────────────────────────
describe("progress.xpHistory", () => {
  const mockHistory = [
    { date: "2026-03-05", xp: 0 },
    { date: "2026-03-06", xp: 100 },
    { date: "2026-03-07", xp: 50 },
    { date: "2026-03-08", xp: 250 },
    { date: "2026-03-09", xp: 0 },
    { date: "2026-03-10", xp: 150 },
    { date: "2026-03-11", xp: 80 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 7 entries for the last 7 days", async () => {
    vi.mocked(db.getXpHistory).mockResolvedValue(mockHistory);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.progress.xpHistory();
    expect(result).toHaveLength(7);
  });

  it("returns correct xp values per day", async () => {
    vi.mocked(db.getXpHistory).mockResolvedValue(mockHistory);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.progress.xpHistory();
    expect(result[1].xp).toBe(100);
    expect(result[3].xp).toBe(250);
  });

  it("returns zero for days with no completions", async () => {
    vi.mocked(db.getXpHistory).mockResolvedValue(mockHistory);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.progress.xpHistory();
    expect(result[0].xp).toBe(0);
    expect(result[4].xp).toBe(0);
  });

  it("returns empty array when db returns empty", async () => {
    vi.mocked(db.getXpHistory).mockResolvedValue([]);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.progress.xpHistory();
    expect(result).toHaveLength(0);
  });

  it("requires authentication", async () => {
    const ctx = createContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.progress.xpHistory()).rejects.toThrow();
  });
});

