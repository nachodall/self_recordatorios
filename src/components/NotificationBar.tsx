"use client";

import { useEffect, useState } from "react";
import {
  checkPushSupport,
  currentPermission,
  enablePush,
  isSubscribed,
  registerServiceWorker,
  type PushSupport,
} from "@/lib/client-push";

type State = "loading" | "off" | "on" | "denied" | "needs-install" | "unsupported";

export default function NotificationBar() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const support: PushSupport = checkPushSupport();
      if (support === "needs-install") return active && setState("needs-install");
      if (support === "unsupported") return active && setState("unsupported");

      // Registramos el SW desde el arranque para poder recibir push.
      await registerServiceWorker();

      const perm = await currentPermission();
      if (perm === "denied") return active && setState("denied");
      const subbed = await isSubscribed();
      if (!active) return;
      setState(subbed && perm === "granted" ? "on" : "off");
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleEnable() {
    setBusy(true);
    const res = await enablePush();
    setBusy(false);
    if (res.ok) return setState("on");
    if (res.reason === "denied") return setState("denied");
    if (res.reason === "unsupported") return setState("unsupported");
    setState("off");
  }

  return (
    <div className="mb-8 text-[13px]" style={{ color: "var(--muted)" }}>
      {state === "loading" && <span>&nbsp;</span>}

      {state === "on" && (
        <span style={{ color: "var(--accent)" }}>● notifications on</span>
      )}

      {state === "off" && (
        <button onClick={handleEnable} disabled={busy} className="term-btn">
          {busy ? "enabling…" : "[ enable notifications ]"}
        </button>
      )}

      {state === "denied" && (
        <span>
          ○ notifications blocked — habilitalas para este sitio en los ajustes del
          navegador
        </span>
      )}

      {state === "needs-install" && (
        <span>
          ○ en iPhone: Compartir → <strong style={{ color: "var(--fg)" }}>Agregar a
          inicio</strong> → abrir la app → habilitar notificaciones
        </span>
      )}

      {state === "unsupported" && (
        <span>○ este navegador no soporta notificaciones push</span>
      )}
    </div>
  );
}
