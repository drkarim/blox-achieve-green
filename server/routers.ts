import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addXp,
  checkAndUnlockBadges,
  completeQuest,
  createLocalUser,
  getTodayCompletedQuests,
  getUserBadges,
  getUserByUsername,
  getUserProgress,
  penaltyXp,
  prestigeUser,
  subtractXp,
  uncompleteQuest,
} from "./db";
import { sdk } from "./_core/sdk";

// All quests with metadata. xp can be positive (reward) or negative (penalty).
export const QUESTS = [
  { key: "daily_grind",      label: "Daily Grind",                    description: "Start your day strong! Complete your morning routine.",    icon: "⚡",  xp: 50,  variant: "normal"    },
  { key: "homework_quest",   label: "Homework Quest",                 description: "Conquer your homework and level up your brain!",           icon: "📚",  xp: 50,  variant: "normal"    },
  { key: "room_recon",       label: "Room Recon",                     description: "Clean and organize your room like a pro.",                 icon: "🏠",  xp: 50,  variant: "normal"    },
  { key: "reading_mission",  label: "Reading Mission",                description: "Read for at least 20 minutes today.",                     icon: "📖",  xp: 50,  variant: "normal"    },
  { key: "custom_training",  label: "Custom Training",                description: "Exercise, practice, or learn something new!",             icon: "🏋️",  xp: 50,  variant: "normal"    },
  { key: "offline_buff",     label: "Power Down: The Offline Buff",   description: "Completed at least 1 hour of screen-free time.",          icon: "🌿",  xp: 80,  variant: "legendary" },
  { key: "system_glitch",    label: "System Glitch",                  description: "A corruption in the system. Activate at your own risk!",  icon: "💀",  xp: -30, variant: "glitch"    },
] as const;

// All badges with metadata
export const BADGES = [
  { key: "first_quest",  label: "First Blood",     description: "Complete your first quest",       icon: "🗡️" },
  { key: "level_2",      label: "Rising Star",     description: "Reach Level 2",                   icon: "⭐" },
  { key: "level_5",      label: "Veteran",         description: "Reach Level 5",                   icon: "🏆" },
  { key: "level_10",     label: "Legend",          description: "Reach Level 10",                  icon: "👑" },
  { key: "xp_500",       label: "XP Hunter",       description: "Earn 500 total XP",               icon: "💎" },
  { key: "xp_1000",      label: "XP Master",       description: "Earn 1,000 total XP",             icon: "🔥" },
  { key: "xp_5000",      label: "XP God",          description: "Earn 5,000 total XP",             icon: "⚡" },
  { key: "grinder",      label: "The Grinder",     description: "Earn 2,500 total XP",             icon: "💪" },
  { key: "prestige",     label: "Prestige",        description: "Reach XP God and Prestige!",       icon: "✨" },
] as const;

function createLocalSessionToken(userId: number, username: string): string {
  // Simple JWT-like token using the session creator
  return `local_${userId}_${username}_${Date.now()}`;
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      // Also clear local auth cookie
      ctx.res.clearCookie("local_session", { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    register: publicProcedure
      .input(z.object({
        username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
        password: z.string().min(6).max(64),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByUsername(input.username);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Username already taken! Choose another one." });
        }
        const passwordHash = await bcrypt.hash(input.password, 12);
        const user = await createLocalUser(input.username, passwordHash);
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create account" });

        // Auto-create progress row
        await getUserProgress(user.id);

        // Set session cookie using the sdk
        const token = await sdk.createSessionToken(user.openId, { name: user.name || user.username || "", expiresInMs: 7 * 24 * 60 * 60 * 1000 });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

        return { success: true, user: { id: user.id, username: user.username, name: user.name } };
      }),

    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByUsername(input.username);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password" });
        }
        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password" });
        }

        // Set session cookie using the sdk
        const token = await sdk.createSessionToken(user.openId, { name: user.name || user.username || "", expiresInMs: 7 * 24 * 60 * 60 * 1000 });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

        return { success: true, user: { id: user.id, username: user.username, name: user.name } };
      }),
  }),

  quest: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const completed = await getTodayCompletedQuests(ctx.user.id);
      return QUESTS.map(q => ({
        ...q,
        completed: completed.includes(q.key),
      }));
    }),

    uncomplete: protectedProcedure
      .input(z.object({ questKey: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const quest = QUESTS.find(q => q.key === input.questKey);
        if (!quest) throw new TRPCError({ code: "NOT_FOUND", message: "Quest not found" });

        const wasUncompleted = await uncompleteQuest(ctx.user.id, input.questKey);
        if (!wasUncompleted) {
          throw new TRPCError({ code: "CONFLICT", message: "Quest was not completed today — nothing to undo." });
        }

        const result = await subtractXp(ctx.user.id, quest.xp);

        return {
          success: true,
          xpLost: quest.xp,
          xp: result.xp,
          level: result.level,
          leveledDown: result.leveledDown,
        };
      }),

    complete: protectedProcedure
      .input(z.object({ questKey: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const quest = QUESTS.find(q => q.key === input.questKey);
        if (!quest) throw new TRPCError({ code: "NOT_FOUND", message: "Quest not found" });

        const wasCompleted = await completeQuest(ctx.user.id, input.questKey);
        if (!wasCompleted) {
          throw new TRPCError({ code: "CONFLICT", message: "Quest already completed today!" });
        }

        // Negative XP quests (e.g. System Glitch) use penaltyXp — floors at 0, no level-down
        let result: { xp: number; level: number; leveledUp: boolean; newLevel: number };
        if (quest.xp < 0) {
          const penalty = await penaltyXp(ctx.user.id, Math.abs(quest.xp));
          result = { xp: penalty.xp, level: penalty.level, leveledUp: false, newLevel: penalty.level };
        } else {
          result = await addXp(ctx.user.id, quest.xp);
        }
        const newBadges = quest.xp > 0 ? await checkAndUnlockBadges(ctx.user.id) : [];

        return {
          success: true,
          xpGained: quest.xp,
          xp: result.xp,
          level: result.level,
          leveledUp: result.leveledUp,
          newLevel: result.newLevel,
          newBadges,
        };
      }),
  }),

  progress: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const progress = await getUserProgress(ctx.user.id);
      const badges = await getUserBadges(ctx.user.id);
      // Compute xpToday: sum XP from today's completed quests (positive quests only — glitch penalties are not "earned" XP)
      const completedTodayKeys = await getTodayCompletedQuests(ctx.user.id);
      const xpToday = completedTodayKeys.reduce((sum, key) => {
        const quest = QUESTS.find(q => q.key === key);
        return sum + (quest && quest.xp > 0 ? quest.xp : 0);
      }, 0);
      return {
        xp: progress?.xp ?? 0,
        level: progress?.level ?? 1,
        totalXp: progress?.totalXp ?? 0,
        xpToday,
        prestigeCount: progress?.prestigeCount ?? 0,
        xpToNextLevel: 500,
        badges,
      };
    }),

    prestige: protectedProcedure.mutation(async ({ ctx }) => {
      // Gate: must have the XP God badge to prestige
      const badges = await getUserBadges(ctx.user.id);
      if (!badges.includes("xp_5000")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must reach XP God status (5,000 total XP) before you can Prestige!",
        });
      }
      const result = await prestigeUser(ctx.user.id);
      return {
        success: true,
        prestigeCount: result.prestigeCount,
      };
    }),
  }),

  badge: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const unlockedKeys = await getUserBadges(ctx.user.id);
      return BADGES.map(b => ({
        ...b,
        unlocked: unlockedKeys.includes(b.key),
      }));
    }),
  }),
});

export type AppRouter = typeof appRouter;
