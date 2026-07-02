"use client";

import { useEffect, useState } from "react";
import type { ReminderDTO } from "@/lib/types";
import { formatStamp, relativeTime, isPast } from "@/lib/format";

function Row({
  r,
  onDelete,
}: {
  r: ReminderDTO;
  onDelete: (id: string) => void;
}) {
  const date = new Date(r.remindAt);
  const sent = r.sentAt !== null;
  const overdue = !sent && isPast(r.remindAt);

  return (
    <li
      className="group flex items-baseline gap-3 py-2.5"
      style={{ opacity: sent ? 0.45 : 1 }}
    >
      <span className="shrink-0 tabular-nums" style={{ color: "var(--accent)" }}>
        {sent ? "✓" : overdue ? "!" : "·"}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 text-[12px]">
          <span className="tabular-nums" style={{ color: "var(--muted)" }}>
            [{formatStamp(date)}]
          </span>
          <span style={{ color: "var(--faint, var(--muted))" }}>
            {sent ? "sent" : relativeTime(date)}
          </span>
        </div>
        <p className="mt-0.5 break-words leading-snug">{r.text}</p>
      </div>

      <button
        onClick={() => onDelete(r.id)}
        className="shrink-0 px-1 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
        style={{ color: "var(--danger)" }}
        aria-label="borrar"
        title="borrar"
      >
        x
      </button>
    </li>
  );
}

export default function ReminderList({
  reminders,
  onDelete,
}: {
  reminders: ReminderDTO[];
  onDelete: (id: string) => void;
}) {
  // Re-render cada 30s para refrescar los tiempos relativos ("in 3h").
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  if (reminders.length === 0) {
    return (
      <p className="py-6 text-[13px]" style={{ color: "var(--faint, var(--muted))" }}>
        {"// no reminders yet"}
      </p>
    );
  }

  const pending = reminders.filter((r) => r.sentAt === null);
  const done = reminders
    .filter((r) => r.sentAt !== null)
    .sort((a, b) => (a.sentAt! < b.sentAt! ? 1 : -1));

  return (
    <ul className="rlist">
      {pending.map((r) => (
        <Row key={r.id} r={r} onDelete={onDelete} />
      ))}

      {done.length > 0 && (
        <li className="select-none pt-5 pb-1 text-[12px]" style={{ color: "var(--faint, var(--muted))" }}>
          — sent —
        </li>
      )}

      {done.map((r) => (
        <Row key={r.id} r={r} onDelete={onDelete} />
      ))}
    </ul>
  );
}
