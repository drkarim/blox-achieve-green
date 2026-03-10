import { boolean, date, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Custom auth fields for username/password login
  username: varchar("username", { length: 32 }).unique(),
  passwordHash: varchar("passwordHash", { length: 256 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tracks XP and level for each user
export const userProgress = mysqlTable("user_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  xp: int("xp").default(0).notNull(),
  level: int("level").default(1).notNull(),
  totalXp: int("totalXp").default(0).notNull(), // all-time XP for badge unlocks
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProgress = typeof userProgress.$inferSelect;

// Daily quest completion tracking (resets each day)
export const userQuests = mysqlTable("user_quests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questKey: varchar("questKey", { length: 64 }).notNull(), // e.g. "daily_grind"
  completedDate: date("completedDate").notNull(), // YYYY-MM-DD
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

export type UserQuest = typeof userQuests.$inferSelect;

// Badge unlock tracking
export const userBadges = mysqlTable("user_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeKey: varchar("badgeKey", { length: 64 }).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type UserBadge = typeof userBadges.$inferSelect;
