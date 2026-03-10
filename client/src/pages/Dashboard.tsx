import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";

// ─── Level-Up Overlay ─────────────────────────────────────────────────────────
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
  quest: { key: string; label: string; description: string; icon: string; xp: number; completed: boolean };
  onComplete: (key: string) => void;
  onUncomplete: (key: string) => void;
  isCompleting: boolean;
  isUncompleting: boolean;
}) {
  const isLoading = isCompleting || isUncompleting;
  return (
    <div className={`roblox-card quest-card-enter p-5 flex items-center gap-4 ${quest.completed ? "roblox-card-completed" : ""}`}>
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
          color: quest.completed ? "oklch(0.45 0.08 142)" : "oklch(0.72 0.22 142)",
          marginTop: "4px",
          transition: "color 0.2s ease",
        }}>
          {quest.completed ? `-${quest.xp} XP if undone` : `+${quest.xp} XP`}
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
            className="roblox-btn roblox-btn-sm"
            onClick={() => onComplete(quest.key)}
            disabled={isLoading}
          >
            {isCompleting ? "⏳" : "✔ Complete"}
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

      toast.success(`+${data.xpGained} XP earned! ⚡`, { duration: 2000 });

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
            <div style={{
              background: "linear-gradient(135deg, oklch(0.20 0.08 142) 0%, oklch(0.15 0.05 142) 100%)",
              border: "2px solid oklch(0.35 0.12 142)",
              borderRadius: "12px",
              padding: "0.75rem 1.25rem",
              textAlign: "center",
            }}>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "0.8rem", color: "oklch(0.55 0.05 145)", letterSpacing: "0.05em" }}>TOTAL XP</div>
              <div style={{ fontFamily: "'Bangers', cursive", fontSize: "1.8rem", color: "oklch(0.72 0.22 142)", letterSpacing: "0.05em" }}>
                {progress?.totalXp ?? 0}
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

        {/* ─── Stats Footer ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Level", value: progress?.level ?? 1, icon: "⭐" },
            { label: "Total XP", value: progress?.totalXp ?? 0, icon: "⚡" },
            { label: "Badges", value: badges?.filter(b => b.unlocked).length ?? 0, icon: "🏆" },
          ].map(stat => (
            <div key={stat.label} className="roblox-card p-4 text-center">
              <div style={{ fontSize: "1.8rem" }}>{stat.icon}</div>
              <div style={{ fontFamily: "'Bangers', cursive", fontSize: "2rem", color: "oklch(0.72 0.22 142)", letterSpacing: "0.05em" }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "0.85rem", color: "oklch(0.55 0.05 145)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
