import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Background grid decoration */}
      <div className="fixed inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(oklch(0.72 0.22 142) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.22 142) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative z-10 text-center max-w-2xl w-full">
        {/* Logo / Title */}
        <div className="mb-2">
          <span className="text-7xl">🎮</span>
        </div>
        <h1 className="text-6xl font-bold mb-2" style={{ fontFamily: "'Bangers', cursive", letterSpacing: "0.05em", color: "oklch(0.72 0.22 142)", textShadow: "0 0 20px oklch(0.72 0.22 142 / 0.5), 0 4px 0 oklch(0.35 0.15 142)" }}>
          THE LEVEL UP PORTAL
        </h1>
        <p className="text-xl mb-8" style={{ color: "oklch(0.65 0.08 142)", fontFamily: "'Fredoka', sans-serif" }}>
          Complete quests. Earn XP. Become a Legend.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: "⚔️", label: "Daily Quests" },
            { icon: "⭐", label: "XP & Levels" },
            { icon: "🏆", label: "Badges" },
          ].map(f => (
            <div key={f.label} className="roblox-card p-4">
              <div className="text-3xl mb-1">{f.icon}</div>
              <div className="font-bold text-sm" style={{ color: "oklch(0.72 0.22 142)", fontFamily: "'Fredoka', sans-serif" }}>{f.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/register">
            <button className="roblox-btn text-xl px-10 py-4">
              🚀 Start Your Quest!
            </button>
          </a>
          <a href="/login">
            <button className="roblox-btn roblox-btn-secondary text-xl px-10 py-4">
              🔑 Login
            </button>
          </a>
        </div>

        <p className="mt-6 text-sm" style={{ color: "oklch(0.45 0.03 145)", fontFamily: "'Fredoka', sans-serif" }}>
          Your progress is saved. Pick up where you left off!
        </p>
      </div>
    </div>
  );
}
