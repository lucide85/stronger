import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "../api/auth";
import { Panel } from "../components/Panel";

interface GarminStatus {
  connected: boolean;
  email?: string;
  lastActivitySyncAt?: string | null;
  lastBodyCompSyncAt?: string | null;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function Settings() {
  const { user, logout } = useAuth();
  const [garmin, setGarmin] = useState<GarminStatus | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [pushStatus, setPushStatus] = useState<string>("");

  function reload() {
    apiFetch<GarminStatus>("/garmin/status").then(setGarmin).catch(() => {});
  }
  useEffect(reload, []);

  async function connectGarmin() {
    await apiFetch("/garmin/connect", { method: "POST", body: JSON.stringify({ email, password }) });
    setPassword("");
    reload();
  }

  async function syncNow() {
    setSyncing(true);
    try {
      await apiFetch("/garmin/sync", { method: "POST" });
      reload();
    } finally {
      setSyncing(false);
    }
  }

  async function enablePush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await apiFetch<{ publicKey: string }>("/push/public-key");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await apiFetch("/push/subscribe", { method: "POST", body: JSON.stringify(sub.toJSON()) });
      setPushStatus("Push-varsler aktivert.");
    } catch (e: any) {
      setPushStatus(e.message ?? "Kunne ikke aktivere push-varsler.");
    }
  }

  return (
    <div className="max-w-[560px] mx-auto px-5 py-8 pb-24 flex flex-col gap-6">
      <div className="font-display text-2xl font-bold tracking-wide">INNSTILLINGER</div>

      <Panel className="p-6 flex flex-col gap-2">
        <span className="font-mono text-xs text-tertiary tracking-widest">BRUKER</span>
        <span className="font-sans text-sm">{user?.name}</span>
        <span className="font-mono text-xs text-secondary">{user?.email}</span>
        <button className="font-mono text-xs text-danger self-start mt-2" onClick={logout}>
          LOGG UT
        </button>
      </Panel>

      <Panel accent="#3DDAD7" className="p-6 flex flex-col gap-3">
        <span className="font-mono text-xs tracking-widest text-cyan">GARMIN CONNECT</span>
        {garmin?.connected ? (
          <>
            <span className="font-sans text-sm text-secondary">Koblet til som {garmin.email}</span>
            <button disabled={syncing} className="font-display text-xs font-bold uppercase bg-cyan text-[#06211F] px-4 py-2 self-start" onClick={syncNow}>
              {syncing ? "SYNKER..." : "SYNK NÅ"}
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              className="bg-raised border border-hair-bright px-3 py-2 text-sm"
              placeholder="Garmin e-post"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="bg-raised border border-hair-bright px-3 py-2 text-sm"
              placeholder="Garmin passord"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="font-display text-xs font-bold uppercase bg-cyan text-[#06211F] px-4 py-2 self-start" onClick={connectGarmin}>
              KOBLE TIL
            </button>
          </div>
        )}
      </Panel>

      <Panel accent="#B7FF3C" className="p-6 flex flex-col gap-3">
        <span className="font-mono text-xs tracking-widest text-lime">PÅMINNELSER</span>
        <span className="font-sans text-sm text-secondary">Aktiver push-varsler for å bli minnet på kroppssjekk.</span>
        <button className="font-display text-xs font-bold uppercase bg-lime text-[#101A05] px-4 py-2 self-start" onClick={enablePush}>
          AKTIVER PUSH-VARSLER
        </button>
        {pushStatus && <span className="font-mono text-[11px] text-secondary">{pushStatus}</span>}
      </Panel>
    </div>
  );
}
