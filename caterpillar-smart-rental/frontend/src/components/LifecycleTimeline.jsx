const EVENT_TONE = {
  OVERDUE_FLAGGED: "bg-signal-high",
  TELEMETRY_ALERT: "bg-signal-high",
  SAFETY_EVENT: "bg-signal-high",
  MAINTENANCE_FLAG: "bg-signal-high",
  CHECKIN: "bg-signal-healthy",
  CHECKOUT: "bg-ink-dim",
};

export function LifecycleTimeline({ events }) {
  return (
    <div className="border border-hairline bg-panel p-3 shadow-[var(--shadow-panel)]">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Lifecycle Timeline</div>
      <ol className="space-y-0">
        {events.map((e, idx) => (
          <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
            {idx < events.length - 1 && (
              <span className="absolute left-[5px] top-3 h-full w-px bg-hairline-strong" />
            )}
            <span className={`relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${EVENT_TONE[e.type] ?? "bg-signal-low"}`} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium text-ink">{e.title}</span>
                <span className="font-mono text-[11px] text-ink-faint">{e.timestamp.replace("T", " ")}</span>
              </div>
              {e.detail && <p className="mt-0.5 text-[13px] text-ink-dim">{e.detail}</p>}
              <span className="text-[11px] text-ink-faint">{e.actor}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
