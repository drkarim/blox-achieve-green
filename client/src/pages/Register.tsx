import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, loading, navigate]);

  const utils = trpc.useUtils();
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Account created! Your adventure begins! 🎉");
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed. Try again!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !confirm.trim()) {
      toast.error("Fill in all fields, warrior!");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match! Try again.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }
    registerMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="fixed inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(oklch(0.72 0.22 142) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.22 142) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚀</div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: "'Bangers', cursive", letterSpacing: "0.05em", color: "oklch(0.72 0.22 142)", textShadow: "0 0 15px oklch(0.72 0.22 142 / 0.4)" }}>
            CREATE YOUR HERO!
          </h1>
          <p style={{ color: "oklch(0.65 0.08 142)", fontFamily: "'Fredoka', sans-serif" }}>
            Join the portal and start your quest!
          </p>
        </div>

        {/* Card */}
        <div className="roblox-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "oklch(0.72 0.22 142)", fontFamily: "'Fredoka', sans-serif", letterSpacing: "0.05em" }}>
                CHOOSE A USERNAME
              </label>
              <input
                type="text"
                className="roblox-input"
                placeholder="YourHeroName123"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                disabled={registerMutation.isPending}
                maxLength={20}
              />
              <p className="text-xs mt-1" style={{ color: "oklch(0.45 0.03 145)", fontFamily: "'Fredoka', sans-serif" }}>
                3–20 characters, letters/numbers/underscores only
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "oklch(0.72 0.22 142)", fontFamily: "'Fredoka', sans-serif", letterSpacing: "0.05em" }}>
                PASSWORD
              </label>
              <input
                type="password"
                className="roblox-input"
                placeholder="Min 6 characters..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={registerMutation.isPending}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: "oklch(0.72 0.22 142)", fontFamily: "'Fredoka', sans-serif", letterSpacing: "0.05em" }}>
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                className="roblox-input"
                placeholder="Repeat your password..."
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                disabled={registerMutation.isPending}
              />
            </div>

            <button
              type="submit"
              className="roblox-btn w-full text-lg py-3 mt-2"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "⏳ Creating hero..." : "⚔️ CREATE MY HERO!"}
            </button>
          </form>
        </div>

        {/* Login link */}
        <div className="text-center mt-6">
          <p style={{ color: "oklch(0.55 0.05 145)", fontFamily: "'Fredoka', sans-serif" }}>
            Already a hero?{" "}
            <a href="/login" className="font-bold" style={{ color: "oklch(0.72 0.22 142)" }}>
              Login here!
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
