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
  checkAndUnlockBadges: vi.fn(),
  getUserBadges: vi.fn(),
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
  it("returns all 5 quests with completion status", async () => {
    vi.mocked(db.getTodayCompletedQuests).mockResolvedValue(["daily_grind"]);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.list();
    expect(result).toHaveLength(5);
    expect(result.find(q => q.key === "daily_grind")?.completed).toBe(true);
    expect(result.find(q => q.key === "homework_quest")?.completed).toBe(false);
  });

  it("returns correct quest labels", async () => {
    vi.mocked(db.getTodayCompletedQuests).mockResolvedValue([]);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.quest.list();
    const labels = result.map(q => q.label);
    expect(labels).toContain("Daily Grind");
    expect(labels).toContain("Homework Quest");
    expect(labels).toContain("Room Recon");
    expect(labels).toContain("Reading Mission");
    expect(labels).toContain("Custom Training");
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
    vi.mocked(db.getUserProgress).mockResolvedValue({ id: 1, userId: 1, xp: 150, level: 1, totalXp: 150, updatedAt: new Date() });
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
  it("returns all 8 badges with unlock status", async () => {
    vi.mocked(db.getUserBadges).mockResolvedValue(["first_quest", "level_2"]);
    const ctx = createContext(createMockUser());
    const caller = appRouter.createCaller(ctx);
    const result = await caller.badge.list();
    expect(result).toHaveLength(8);
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
  it("has exactly 5 quests", () => {
    expect(QUESTS).toHaveLength(5);
  });

  it("each quest awards 50 XP", () => {
    QUESTS.forEach(q => expect(q.xp).toBe(50));
  });

  it("has the required quest names", () => {
    const labels = QUESTS.map(q => q.label);
    expect(labels).toContain("Daily Grind");
    expect(labels).toContain("Homework Quest");
    expect(labels).toContain("Room Recon");
    expect(labels).toContain("Reading Mission");
    expect(labels).toContain("Custom Training");
  });
});

describe("BADGES constant", () => {
  it("has exactly 8 badges", () => {
    expect(BADGES).toHaveLength(8);
  });
});
