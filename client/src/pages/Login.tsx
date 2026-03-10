import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, loading, navigate]);

  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Welcome back, adventurer! 🎮");
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Login failed. Check your credentials!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Fill in all fields, warrior!");
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="fixed inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(oklch(0.72 0.22 142) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.22 142) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: "'Bangers', cursive", letterSpacing: "0.05em", color: "oklch(0.72 0.22 142)", textShadow: "0 0 15px oklch(0.72 0.22 142 / 0.4)" }}>
            WELCOME BACK!
          </h1>
          <p style={{ color: "oklch(0.65 0.08 142)", fontFamily: "'Fredoka', sans-serif" }}>
            Your quests await, hero.
          </p>
        </div>

        {/* Card */}
        <div className="roblox-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "oklch(0.72 0.22 142)", fontFamily: "'Fredoka', sans-serif", letterSpacing: "0.05em" }}>
                USERNAME
              </label>
              <input
                type="text"
                className="roblox-input"
                placeholder="Enter your username..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loginMutation.isPending}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "oklch(0.72 0.22 142)", fontFamily: "'Fredoka', sans-serif", letterSpacing: "0.05em" }}>
                PASSWORD
              </label>
              <input
                type="password"
                className="roblox-input"
                placeholder="Enter your password..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loginMutation.isPending}
              />
            </div>

            <button
              type="submit"
              className="roblox-btn w-full text-lg py-3 mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "⏳ Logging in..." : "🎮 ENTER THE PORTAL"}
            </button>
          </form>
        </div>

        {/* Register link */}
        <div className="text-center mt-6">
          <p style={{ color: "oklch(0.55 0.05 145)", fontFamily: "'Fredoka', sans-serif" }}>
            New adventurer?{" "}
            <a href="/register" className="font-bold" style={{ color: "oklch(0.72 0.22 142)" }}>
              Create an account!
            </a>
          </p>
        </div>
        <div className="text-center mt-3">
          <a href="/" style={{ color: "oklch(0.45 0.03 145)", fontFamily: "'Fredoka', sans-serif", fontSize: "0.9rem" }}>
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
