import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../api/auth";
import { Panel } from "../components/Panel";

export function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, name);
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Noe gikk galt");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <div className="font-display text-3xl font-bold tracking-wide">STRONGER</div>
          <div className="font-mono text-[11px] text-tertiary tracking-[0.2em] mt-1">PERFORMANCE LOG</div>
        </div>

        <Panel accent="#FF8C42" className="p-6 flex flex-col gap-4">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <input
                className="bg-raised border border-hair-bright px-3 py-3 text-sm font-sans outline-none focus:border-amber"
                placeholder="Navn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <input
              className="bg-raised border border-hair-bright px-3 py-3 text-sm font-sans outline-none focus:border-amber"
              placeholder="E-post"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="bg-raised border border-hair-bright px-3 py-3 text-sm font-sans outline-none focus:border-amber"
              placeholder="Passord"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <div className="text-danger text-xs font-mono">{error}</div>}
            <button
              disabled={busy}
              className="font-display font-bold uppercase tracking-wide text-sm bg-amber text-[#1A1006] py-3 disabled:opacity-50"
            >
              {mode === "login" ? "LOGG INN" : "OPPRETT KONTO"}
            </button>
          </form>
        </Panel>

        <button
          className="font-mono text-xs text-secondary text-center"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Ny bruker? Opprett konto" : "Har du allerede konto? Logg inn"}
        </button>
      </div>
    </div>
  );
}
