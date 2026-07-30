import { useState, type FormEvent } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { Logo } from "../ui";
import { sound } from "../../utils/sound";

export function AuthGate() {
  const { signIn, signUp, error } = useAuthStore();
  const clearError = () => useAuthStore.setState({ error: null });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    sound.click();
    if (mode === "signin") {
      await signIn(username, password);
    } else {
      await signUp(username, password);
    }
  };

  return (
    <main className="min-h-screen bg-paper text-fg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-1.5 justify-center mb-8">
          <Logo iconSize={120} textSize={32} />
          <p className="font-sans text-xs text-muted tracking-wide mt-1">
            Bring order to your project chaos.
          </p>
        </div>

        <div className="bg-surface border-[3px] border-line rounded-xl shadow-brut p-6">
          <div className="flex mb-6 border-[3px] border-line rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => { setMode("signin"); clearError(); }}
              className={`flex-1 py-2 font-sans text-sm font-bold transition-colors ${
                mode === "signin" ? "bg-brutPink text-fg" : "text-muted hover:text-fg"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); clearError(); }}
              className={`flex-1 py-2 font-sans text-sm font-bold transition-colors ${
                mode === "signup" ? "bg-brutPink text-fg" : "text-muted hover:text-fg"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block font-sans text-xs font-semibold text-muted mb-1">
                Username
              </label>
              <input
                id="auth-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-paper border-[3px] border-line rounded-lg px-3 py-2 font-mono text-sm text-fg outline-none transition-colors focus:border-brutBlue"
              />
            </div>

            <div>
              <label className="block font-sans text-xs font-semibold text-muted mb-1">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-paper border-[3px] border-line rounded-lg px-3 py-2 font-mono text-sm text-fg outline-none transition-colors focus:border-brutBlue"
              />
            </div>

            {error && (
              <p role="alert" className="font-sans text-xs text-brutRed font-semibold">
                {error}
              </p>
            )}

            <button
              id="auth-submit"
              type="submit"
              className="bg-brutPink border-[3px] border-line rounded-lg py-2.5 font-sans text-sm font-bold text-fg transition-all hover:bg-brutYellow active:scale-95 shadow-brut-sm"
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="font-sans text-xs text-muted text-center mt-4">
          Local account only — nothing leaves this device.
        </p>
      </div>
    </main>
  );
}
