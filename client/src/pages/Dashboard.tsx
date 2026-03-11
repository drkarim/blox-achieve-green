import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

// ─── XP History Chart ────────────────────────────────────────────────────────
function XpHistoryChart({ data }: { data: { date: string; xp: number }[] }) {
  const formatted = data.map(d => {
    const dt = new Date(d.date + "T12:00:00");
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    const isToday = d.date === todayStr;
    const dayLabel = dt.toLocaleDateString(undefined, { weekday: "short" });
    return { day: isToday ? "Today" : dayLabel, xp: d.xp, isToday };
  });
  const maxXp = Math.max(...formatted.map(d => d.xp), 100);
  const allEmpty = formatted.every(d => d.xp === 0);
  return (
    <div className="roblox-card p-5">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "1.4rem" }}>📊</span>
        <span style={{ fontFamily: "'Bangers', cursive", fontSize: "1.4rem", color: "oklch(0.72 0.22 142)", letterSpacing: "0.05em" }}>7-DAY XP HISTORY</span>
        <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "0.8rem", color: "oklch(0.45 0.05 145)", marginLeft: "auto" }}>XP earned per day</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.04 142)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontFamily: "'Fredoka', sans-serif", fontSize: 13, fill: "oklch(0.65 0.05 145)" }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[0, maxXp + 20]}
            tick={{ fontFamily: "'Fredoka', sans-serif", fontSize: 12, fill: "oklch(0.45 0.05 145)" }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "oklch(0.18 0.04 142)" }}
            contentStyle={{
              background: "oklch(0.13 0.04 142)",
              border: "2px solid oklch(0.35 0.15 142)",
              borderRadius: "10px",
              fontFamily: "'Fredoka', sans-serif",
              color: "oklch(0.97 0.01 145)",
            }}
            formatter={(value: number) => [`${value} XP`, "Earned"]}
          />
          <Bar dataKey="xp" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {formatted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isToday ? "oklch(0.80 0.26 142)" : entry.xp > 0 ? "oklch(0.60 0.20 142)" : "oklch(0.22 0.06 142)"}
                stroke={entry.isToday ? "oklch(0.90 0.28 142)" : "none"}
                strokeWidth={entry.isToday ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {allEmpty && (
        <div style={{ textAlign: "center", fontFamily: "'Fredoka', sans-serif", color: "oklch(0.40 0.06 142)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
          No XP earned yet this week — complete quests to fill the chart! 🎮
        </div>
      )}
    </div>
  );
}

// ─── Prestige Overlay ───────────────────────────────────────────────────────────
function PrestigeOverlay({ prestigeCount, onClose }: { prestigeCount: number; onClose: () => void }) {
  useEffect(() => {
    // Gold + white confetti burst for prestige
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.5 },
        ...opts,
        particleCount: Math.floor(300 * particleRatio),
        colors: ["#FFD700", "#FFA500", "#FFEC8B", "#FFFACD", "#ffffff", "#32CD32"],
      });
    };
    fire(0.3, { spread: 80, startVelocity: 60 });
    fire(0.25, { spread: 120 });
    fire(0.35, { spread: 160, decay: 0.91, scalar: 0.9 });
    fire(0.1,  { spread: 200, startVelocity: 30, decay: 0.92, scalar: 1.3 });
    // Second burst after 0.8s
    setTimeout(() => {
      fire(0.4, { spread: 100, startVelocity: 55 });
      fire(0.2, { spread: 140, decay: 0.93 });
    }, 800);

    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="levelup-overlay" onClick={onClose} style={{ background: "oklch(0 0 0 / 0.88)" }}>
      <div className="levelup-box" style={{ border: "4px solid #FFD700", boxShadow: "0 0 60px #FFD700, 0 0 120px oklch(0.72 0.22 142 / 0.4)" }}>
        <div style={{ fontSize: "5rem", lineHeight: 1, marginBottom: "0.5rem" }}>✨</div>
        <div style={{
          fontFamily: "'Bangers', cursive",
          fontSize: "4.5rem",
          letterSpacing: "0.05em",
          color: "#FFD700",
          textShadow: "0 0 40px #FFD700, 0 4px 0 #8B6914",
          lineHeight: 1,
        }}>
          PRESTIGE!
        </div>
        <div style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: "1.8rem",
          fontWeight: 700,
          color: "oklch(0.97 0.01 145)",
          marginTop: "0.5rem",
        }}>
          {ordinal(prestigeCount)} Prestige Achieved!
        </div>
        <div style={{ color: "#FFD700", fontFamily: "'Fredoka', sans-serif", marginTop: "0.5rem", fontSize: "1.1rem" }}>
          XP &amp; Level reset. Your legend lives on! ✨
        </div>
        <div style={{ color: "oklch(0.45 0.03 145)", fontFamily: "'Fredoka', sans-serif", marginTop: "1.5rem", fontSize: "0.9rem" }}>
          (Click anywhere to continue)
        </div>
      </div>
    </div>
  );
}

// ─── Level-Up Overlay ────────────────────────────────────────────────────────────
function LevelUpOverlay({ level, onClose }: { level: number; onClose: () => void }) {
  useEffect(() => {
    // Fire green confetti
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.6 },
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
        colors: ["#32CD32", "#00FF00", "#006400", "#90EE90", "#ADFF2F", "#7FFF00", "#00FA9A"],
      });
    };
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2,  { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1,  { spread: 120, startVelocity: 45 });

    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="levelup-overlay" onClick={onClose}>
      <div className="levelup-box">
        <div style={{ fontSize: "5rem", lineHeight: 1, marginBottom: "0.5rem" }}>⭐</div>
        <div style={{
          fontFamily: "'Bangers', cursive",
          fontSize: "5rem",
          letterSpacing: "0.05em",
          color: "oklch(0.72 0.22 142)",
          textShadow: "0 0 30px oklch(0.72 0.22 142 / 0.8), 0 4px 0 oklch(0.35 0.15 142)",
          lineHeight: 1,
        }}>
          LEVEL UP!
        </div>
        <div style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: "2.5rem",
          fontWeight: 700,
          color: "oklch(0.97 0.01 145)",
          marginTop: "0.5rem",
        }}>
          You reached Level {level}!
        </div>
        <div style={{ color: "oklch(0.65 0.08 142)", fontFamily: "'Fredoka', sans-serif", marginTop: "0.75rem", fontSize: "1.1rem" }}>
          Keep grinding, hero! 💪
        </div>
        <div style={{ color: "oklch(0.45 0.03 145)", fontFamily: "'Fredoka', sans-serif", marginTop: "1.5rem", fontSize: "0.9rem" }}>
          (Click anywhere to continue)
        </div>
      </div>
    </div>
  );
}

// ─── XP Bar ───────────────────────────────────────────────────────────────────
function XPBar({ xp, level, xpToNextLevel }: { xp: number; level: number; xpToNextLevel: number }) {
  const pct = Math.min(100, Math.round((xp / xpToNextLevel) * 100));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1rem", color: "oklch(0.72 0.22 142)" }}>
          ⚡ XP Progress
        </div>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1rem", color: "oklch(0.97 0.01 145)" }}>
          {xp} / {xpToNextLevel} XP
        </div>
      </div>
      <div className="xp-bar-container">
        <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        <div className="xp-bar-text">{pct}%</div>
      </div>
    </div>
  );
}

// ─── Quest Card ───────────────────────────────────────────────────────────────
function QuestCard({
  quest,
  onComplete,
  onUncomplete,
  isCompleting,
  isUncompleting,
}: {
  quest: { key: string; label: string; description: string; icon: string; xp: number; variant?: string; completed: boolean };
  onComplete: (key: string) => void;
  onUncomplete: (key: string) => void;
  isCompleting: boolean;
  isUncompleting: boolean;
}) {
  const isLoading = isCompleting || isUncompleting;
  const isLegendary = quest.variant === "legendary";
  const isGlitch = quest.variant === "glitch";
  const cardClass = quest.completed
    ? "roblox-card-completed"
    : isLegendary ? "roblox-card-legendary"
    : isGlitch    ? "roblox-card-glitch"
    : "";
  return (
    <div className={`roblox-card quest-card-enter p-5 flex items-center gap-4 ${cardClass}`}>
      {/* Icon */}
      <div style={{
        fontSize: "2.5rem",
        width: "60px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "12px",
        background: quest.completed
          ? "oklch(0.22 0.04 142)"
          : "linear-gradient(135deg, oklch(0.22 0.10 142) 0%, oklch(0.16 0.06 142) 100%)",
        border: `2px solid ${quest.completed ? "oklch(0.40 0.10 142)" : "oklch(0.35 0.14 142)"}`,
        flexShrink: 0,
        filter: quest.completed ? "grayscale(0.5)" : "none",
        transition: "all 0.2s ease",
      }}>
        {quest.completed ? "✅" : quest.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div style={{
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 700,
          fontSize: "1.2rem",
          color: quest.completed ? "oklch(0.55 0.08 142)" : "oklch(0.97 0.01 145)",
          textDecoration: quest.completed ? "line-through" : "none",
          transition: "all 0.2s ease",
        }}>
          {quest.label}
        </div>
        <div style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: "0.9rem",
          color: "oklch(0.55 0.05 145)",
          marginTop: "2px",
        }}>
          {quest.description}
        </div>
        <div style={{
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 700,
          fontSize: "0.85rem",
          color: quest.completed
            ? "oklch(0.45 0.08 142)"
            : isGlitch
              ? "oklch(0.65 0.20 320)"
              : isLegendary
                ? "oklch(0.82 0.20 95)"
                : "oklch(0.72 0.22 142)",
          marginTop: "4px",
          transition: "color 0.2s ease",
        }}>
          {quest.completed
            ? (isGlitch ? "Glitch activated today" : `-${quest.xp} XP if undone`)
            : isGlitch
              ? `-${Math.abs(quest.xp)} XP penalty`
              : `+${quest.xp} XP`
          }
        </div>
      </div>

      {/* Action Button */}
      <div style={{ flexShrink: 0 }}>
        {quest.completed ? (
          <button
            className="roblox-btn roblox-btn-sm roblox-btn-undo"
            onClick={() => onUncomplete(quest.key)}
            disabled={isLoading}
            title="Click to undo this quest completion"
          >
            {isUncompleting ? "⏳" : "↩ Undo"}
          </button>
        ) : (
          <button
            className={`roblox-btn roblox-btn-sm ${
              isGlitch    ? "roblox-btn-glitch"
              : isLegendary ? "roblox-btn-legendary"
              : ""
            }`}
            onClick={() => onComplete(quest.key)}
            disabled={isLoading}
          >
            {isCompleting ? "⏳" : isGlitch ? "⚠️ Activate" : "✔ Complete"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Badge Room ───────────────────────────────────────────────────────────────
function BadgeRoom({ badges }: { badges: { key: string; label: string; description: string; icon: string; unlocked: boolean }[] }) {
  return (
    <div className="roblox-card">
      <div className="panel-header flex items-center gap-3">
        <span style={{ fontSize: "1.5rem" }}>🏆</span>
        <div>
          <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: "1.6rem", letterSpacing: "0.05em", color: "oklch(0.72 0.22 142)", margin: 0 }}>
            BADGE ROOM
          </h2>
          <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "0.85rem", color: "oklch(0.55 0.05 145)", margin: 0 }}>
            {badges.filter(b => b.unlocked).length} / {badges.length} unlocked
          </p>
        </div>
      </div>
      <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {badges.map(badge => (
          <div key={badge.key} className={`badge-item ${badge.unlocked ? "unlocked" : ""}`} title={badge.description}>
            <div className="badge-icon">{badge.icon}</div>
            <div style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 700,
              fontSize: "0.8rem",
              color: badge.unlocked ? "oklch(0.72 0.22 142)" : "oklch(0.35 0.03 145)",
            }}>
              {badge.label}
            </div>
            <div style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: "0.7rem",
              color: badge.unlocked ? "oklch(0.55 0.05 145)" : "oklch(0.28 0.02 145)",
              textAlign: "center",
            }}>
              {badge.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [showPrestige, setShowPrestige] = useState(false);
  const [prestigeCountDisplay, setPrestigeCountDisplay] = useState(0);
  const [completingQuest, setCompletingQuest] = useState<string | null>(null);
  const [uncomletingQuest, setUncompletingQuest] = useState<string | null>(null);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, loading, navigate]);

  const { data: quests, isLoading: questsLoading } = trpc.quest.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const { data: progress, isLoading: progressLoading } = trpc.progress.get.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const { data: badges, isLoading: badgesLoading } = trpc.badge.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });
  const { data: xpHistory } = trpc.progress.xpHistory.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const completeQuestMutation = trpc.quest.complete.useMutation({
    onMutate: async ({ questKey }) => {
      setCompletingQuest(questKey);
      // Optimistic update: mark quest as completed immediately
      await utils.quest.list.cancel();
      const prev = utils.quest.list.getData();
      utils.quest.list.setData(undefined, (old) =>
        old?.map(q => q.key === questKey ? { ...q, completed: true } : q)
      );
      return { prev };
    },
    onSuccess: (data) => {
      setCompletingQuest(null);
      utils.progress.get.invalidate();
      utils.badge.list.invalidate();

      if (data.xpGained < 0) {
        toast(`⚠️ System Glitch! ${data.xpGained} XP penalty applied.`, { duration: 2500 });
      } else {
        toast.success(`+${data.xpGained} XP earned! ⚡`, { duration: 2000 });
      }

      if (data.newBadges && data.newBadges.length > 0) {
        data.newBadges.forEach((badgeKey: string) => {
          toast.success(`🏆 New Badge Unlocked: ${badgeKey.replace(/_/g, ' ')}!`, { duration: 3000 });
        });
      }

      if (data.leveledUp) {
        setNewLevel(data.newLevel);
        setShowLevelUp(true);
      }
    },
    onError: (err, _vars, context) => {
      setCompletingQuest(null);
      // Rollback optimistic update
      if (context?.prev) utils.quest.list.setData(undefined, context.prev);
      toast.error(err.message || "Quest completion failed!");
    },
    onSettled: () => {
      utils.quest.list.invalidate();
    },
  });

  const uncompleteQuestMutation = trpc.quest.uncomplete.useMutation({
    onMutate: async ({ questKey }) => {
      setUncompletingQuest(questKey);
      await utils.quest.list.cancel();
      const prev = utils.quest.list.getData();
      utils.quest.list.setData(undefined, (old) =>
        old?.map(q => q.key === questKey ? { ...q, completed: false } : q)
      );
      return { prev };
    },
    onSuccess: (data) => {
      setUncompletingQuest(null);
      utils.progress.get.invalidate();
      toast(`-${data.xpLost} XP removed ↩`, { duration: 2000 });
      if (data.leveledDown) {
        toast(`Level dropped to ${data.level} — keep going! 💪`, { duration: 3000 });
      }
    },
    onError: (err, _vars, context) => {
      setUncompletingQuest(null);
      if (context?.prev) utils.quest.list.setData(undefined, context.prev);
      toast.error(err.message || "Could not undo quest!");
    },
    onSettled: () => {
      utils.quest.list.invalidate();
    },
  });

  const handleCompleteQuest = useCallback((questKey: string) => {
    completeQuestMutation.mutate({ questKey });
  }, [completeQuestMutation]);

  const handleUncompleteQuest = useCallback((questKey: string) => {
    uncompleteQuestMutation.mutate({ questKey });
  }, [uncompleteQuestMutation]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/");
  }, [logout, navigate]);

  const handleCloseLevelUp = useCallback(() => setShowLevelUp(false), []);
  const handleClosePrestige = useCallback(() => setShowPrestige(false), []);

  const prestigeMutation = trpc.progress.prestige.useMutation({
    onSuccess: (data) => {
      setPrestigeCountDisplay(data.prestigeCount);
      setShowPrestige(true);
      utils.progress.get.invalidate();
      utils.badge.list.invalidate();
      utils.quest.list.invalidate();
      toast.success(`✨ PRESTIGE ${data.prestigeCount} achieved! XP & Level reset!`, { duration: 4000 });
    },
    onError: (err) => {
      toast.error(err.message || "Prestige failed!");
    },
  });

  const handlePrestige = useCallback(() => {
    if (window.confirm("Are you sure? Your XP and Level will reset to 1, but your badges and Total XP are kept forever. This is the ultimate flex! ✨")) {
      prestigeMutation.mutate();
    }
  }, [prestigeMutation]);

  // Check if player is eligible to prestige (has XP God badge)
  const canPrestige = progress?.badges?.includes("xp_5000") ?? false;

  const displayName = user?.username || user?.name || "Hero";
  const completedCount = quests?.filter(q => q.completed).length ?? 0;
  const totalQuests = quests?.length ?? 5;

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.5rem", color: "oklch(0.72 0.22 142)" }}>
          Loading your portal... ⚡
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Prestige Overlay */}
      {showPrestige && <PrestigeOverlay prestigeCount={prestigeCountDisplay} onClose={handleClosePrestige} />}
      {/* Level-Up Overlay */}
      {showLevelUp && <LevelUpOverlay level={newLevel} onClose={handleCloseLevelUp} />}

      {/* ─── Top Header Bar ─────────────────────────────────────────────────── */}
      <header style={{
        background: "linear-gradient(180deg, oklch(0.14 0.06 142) 0%, oklch(0.11 0.03 142) 100%)",
        borderBottom: "3px solid oklch(0.28 0.10 142)",
        boxShadow: "0 4px 20px oklch(0 0 0 / 0.5)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div className="container py-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Logo */}
            <div className="flex items-center gap-2 mr-auto">
              <span style={{ fontSize: "1.8rem" }}>🎮</span>
              <span style={{ fontFamily: "'Bangers', cursive", fontSize: "1.5rem", letterSpacing: "0.05em", color: "oklch(0.72 0.22 142)" }}>
                LEVEL UP PORTAL
              </span>
            </div>

            {/* Prestige Counter — shown only when prestigeCount > 0 */}
            {(progress?.prestigeCount ?? 0) > 0 && (
              <div style={{
                background: "linear-gradient(135deg, oklch(0.22 0.14 65) 0%, oklch(0.16 0.10 65) 100%)",
                border: "2px solid #FFD700",
                borderRadius: "10px",
                padding: "0.3rem 0.8rem",
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 700,
                color: "#FFD700",
                fontSize: "1rem",
                boxShadow: "0 0 12px #FFD700aa",
              }}>
                ✨ Prestige {progress?.prestigeCount}
              </div>
            )}

            {/* Level Badge */}
            <div style={{
              background: "linear-gradient(135deg, oklch(0.22 0.10 142) 0%, oklch(0.16 0.06 142) 100%)",
              border: "2px solid oklch(0.72 0.22 142)",
              borderRadius: "10px",
              padding: "0.3rem 0.8rem",
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 700,
              color: "oklch(0.72 0.22 142)",
              fontSize: "1rem",
              boxShadow: "0 0 10px oklch(0.72 0.22 142 / 0.3)",
            }}>
              ⭐ LVL {progress?.level ?? 1}
            </div>

            {/* Logout */}
            <button className="roblox-btn roblox-btn-sm roblox-btn-secondary" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container pt-6 space-y-6">
        {/* ─── Welcome Banner ──────────────────────────────────────────────── */}
        <div className="roblox-card p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 style={{
                fontFamily: "'Bangers', cursive",
                fontSize: "2.2rem",
                letterSpacing: "0.04em",
                color: "oklch(0.97 0.01 145)",
                margin: 0,
                lineHeight: 1.1,
              }}>
                Welcome back, <span style={{ color: "oklch(0.72 0.22 142)", textShadow: "0 0 12px oklch(0.72 0.22 142 / 0.5)" }}>{displayName}</span>!
              </h1>
              <p style={{ fontFamily: "'Fredoka', sans-serif", color: "oklch(0.55 0.05 145)", marginTop: "4px", fontSize: "1rem" }}>
                {completedCount === totalQuests
                  ? "🎉 All quests complete! You're a legend!"
                  : `${completedCount}/${totalQuests} quests done today. Keep grinding!`}
              </p>
            </div>
            {/* XP Breakdown: Today vs All-Time */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {/* Today's XP */}
              <div style={{
                background: "linear-gradient(135deg, oklch(0.18 0.10 142) 0%, oklch(0.13 0.06 142) 100%)",
                border: "2px solid oklch(0.45 0.18 142)",
                borderRadius: "12px",
                padding: "0.75rem 1.25rem",
                textAlign: "center",
                minWidth: "110px",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
                  background: "oklch(0.55 0.22 142)", color: "#000", fontSize: "0.6rem",
                  fontFamily: "'Fredoka', sans-serif", fontWeight: 700, letterSpacing: "0.08em",
                  padding: "1px 8px", borderRadius: "99px", whiteSpace: "nowrap",
                }}>TODAY</div>
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "0.75rem", color: "oklch(0.55 0.05 145)", letterSpacing: "0.05em", marginTop: "4px" }}>XP EARNED</div>
                <div style={{ fontFamily: "'Bangers', cursive", fontSize: "2rem", color: "oklch(0.80 0.26 142)", letterSpacing: "0.05em", lineHeight: 1 }}>
                  +{progress?.xpToday ?? 0}
                </div>
              </div>
              {/* All-Time Total XP */}
              <div style={{
                background: "linear-gradient(135deg, oklch(0.20 0.08 142) 0%, oklch(0.15 0.05 142) 100%)",
                border: "2px solid oklch(0.35 0.12 142)",
                borderRadius: "12px",
                padding: "0.75rem 1.25rem",
                textAlign: "center",
                minWidth: "110px",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)",
                  background: "oklch(0.30 0.10 142)", color: "oklch(0.75 0.18 142)", fontSize: "0.6rem",
                  fontFamily: "'Fredoka', sans-serif", fontWeight: 700, letterSpacing: "0.08em",
                  padding: "1px 8px", borderRadius: "99px", whiteSpace: "nowrap",
                  border: "1px solid oklch(0.40 0.14 142)",
                }}>ALL-TIME</div>
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "0.75rem", color: "oklch(0.55 0.05 145)", letterSpacing: "0.05em", marginTop: "4px" }}>TOTAL XP</div>
                <div style={{ fontFamily: "'Bangers', cursive", fontSize: "2rem", color: "oklch(0.72 0.22 142)", letterSpacing: "0.05em", lineHeight: 1 }}>
                  {progress?.totalXp ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-5">
            <XPBar
              xp={progress?.xp ?? 0}
              level={progress?.level ?? 1}
              xpToNextLevel={progress?.xpToNextLevel ?? 500}
            />
          </div>
        </div>

        {/* ─── Quest Dashboard ─────────────────────────────────────────────── */}
        <div className="roblox-card">
          <div className="panel-header flex items-center gap-3">
            <span style={{ fontSize: "1.5rem" }}>⚔️</span>
            <div>
              <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: "1.6rem", letterSpacing: "0.05em", color: "oklch(0.72 0.22 142)", margin: 0 }}>
                DAILY QUESTS
              </h2>
              <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "0.85rem", color: "oklch(0.55 0.05 145)", margin: 0 }}>
                Resets every day at midnight
              </p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {questsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="roblox-card p-5 flex items-center gap-4" style={{ opacity: 0.5 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 12, background: "oklch(0.22 0.04 142)" }} />
                  <div className="flex-1 space-y-2">
                    <div style={{ height: 20, borderRadius: 6, background: "oklch(0.22 0.04 142)", width: "60%" }} />
                    <div style={{ height: 14, borderRadius: 6, background: "oklch(0.18 0.02 145)", width: "80%" }} />
                  </div>
                </div>
              ))
            ) : (
              quests?.map(quest => (
                <QuestCard
                  key={quest.key}
                  quest={quest}
                  onComplete={handleCompleteQuest}
                  onUncomplete={handleUncompleteQuest}
                  isCompleting={completingQuest === quest.key}
                  isUncompleting={uncomletingQuest === quest.key}
                />
              ))
            )}
          </div>
        </div>

        {/* ─── Badge Room ──────────────────────────────────────────────────── */}
        {!badgesLoading && badges && (
          <BadgeRoom badges={badges} />
        )}
        {/* ─── Prestige Button ─────────────────────────────────────────────────── */}
        {canPrestige && (
          <div className="roblox-card p-6 text-center" style={{ border: "3px solid #FFD700", boxShadow: "0 0 30px #FFD70044" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>✨</div>
            <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: "2.5rem", letterSpacing: "0.05em", color: "#FFD700", margin: 0, textShadow: "0 0 20px #FFD700" }}>
              PRESTIGE UNLOCKED!
            </h2>
            <p style={{ fontFamily: "'Fredoka', sans-serif", color: "oklch(0.75 0.05 145)", marginTop: "0.5rem", fontSize: "1rem", maxWidth: "480px", margin: "0.5rem auto 0" }}>
              You've reached <strong style={{ color: "#FFD700" }}>XP God</strong> status! Prestige to reset your XP &amp; Level back to 1 and earn the legendary <strong style={{ color: "#FFD700" }}>✨ Prestige Badge</strong>. Your Total XP and all badges are kept forever.
            </p>
            <button
              className="roblox-btn mt-5"
              style={{ background: "linear-gradient(180deg, #FFD700 0%, #FFA500 100%)", borderColor: "#8B6914", color: "#1a0f00", boxShadow: "0 6px 0 #8B6914, 0 8px 20px #FFD70066", fontSize: "1.2rem", padding: "0.75rem 2.5rem" }}
              onClick={handlePrestige}
              disabled={prestigeMutation.isPending}
            >
              {prestigeMutation.isPending ? "⏳ Prestiging..." : "✨ PRESTIGE NOW"}
            </button>
          </div>
        )}

        {/* ─── Stats Footer ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Level */}
          <div className="roblox-card p-4 text-center">
            <div style={{ fontSize: "1.8rem" }}>⭐</div>
            <div style={{ fontFamily: "'Bangers', cursive", fontSize: "2rem", color: "oklch(0.72 0.22 142)", letterSpacing: "0.05em" }}>
              {progress?.level ?? 1}
            </div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "0.85rem", color: "oklch(0.55 0.05 145)" }}>Level</div>
          </div>
          {/* Today's XP */}
          <div className="roblox-card p-4 text-center" style={{ border: "2px solid oklch(0.45 0.18 142)" }}>
            <div style={{ fontSize: "1.8rem" }}>🌟</div>
            <div style={{ fontFamily: "'Bangers', cursive", fontSize: "2rem", color: "oklch(0.80 0.26 142)", letterSpacing: "0.05em" }}>
              +{progress?.xpToday ?? 0}
            </div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "0.85rem", color: "oklch(0.55 0.05 145)" }}>Today's XP</div>
          </div>
          {/* All-Time Total XP */}
          <div className="roblox-card p-4 text-center">
            <div style={{ fontSize: "1.8rem" }}>⚡</div>
            <div style={{ fontFamily: "'Bangers', cursive", fontSize: "2rem", color: "oklch(0.72 0.22 142)", letterSpacing: "0.05em" }}>
              {progress?.totalXp ?? 0}
            </div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "0.85rem", color: "oklch(0.55 0.05 145)" }}>Total XP</div>
          </div>
          {/* Badges */}
          <div className="roblox-card p-4 text-center">
            <div style={{ fontSize: "1.8rem" }}>🏆</div>
            <div style={{ fontFamily: "'Bangers', cursive", fontSize: "2rem", color: "oklch(0.72 0.22 142)", letterSpacing: "0.05em" }}>
              {badges?.filter(b => b.unlocked).length ?? 0}
            </div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "0.85rem", color: "oklch(0.55 0.05 145)" }}>Badges</div>
          </div>
        </div>

        {/* ─── XP History Chart ──────────────────────────────────────────────── */}
        {xpHistory && xpHistory.length > 0 && (
          <XpHistoryChart data={xpHistory} />
        )}
      </div>
    </div>
  );
}
