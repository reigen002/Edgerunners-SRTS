import { IconClock } from "./icons";

const EVENT_TONE = {
  OVERDUE_FLAGGED: "bg-signal-critical",
  TELEMETRY_ALERT: "bg-signal-high",
  SAFETY_EVENT: "bg-signal-high",
  MAINTENANCE_FLAG: "bg-signal-high",
  CHECKIN: "bg-signal-healthy",
  CHECKOUT: "bg-ink-dim",
};

export function LifecycleTimeline({ events }) {
  return (
    <div className="border border-hairline-strong bg-panel-raised shadow-[var(--shadow-raised)]">
      <div className="flex items-center gap-2 border-b border-hairline px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-ink-dim">
        <IconClock className="text-[14px] text-ink-faint" /> Lifecycle Timeline
      </div>
      <ol className="px-5 py-5">
        {events.map((e, idx) => {
          const isLatest = idx === events.length - 1;
          return (
            <li key={e.id} className="relative flex gap-4 pb-7 last:pb-0">
              {idx < events.length - 1 && (
                <span className="absolute left-[7px] top-4 h-full w-0.5 bg-hairline-strong" />
              )}
              <span
                className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-panel-raised ${EVENT_TONE[e.type] ?? "bg-signal-low"} ${
                  isLatest ? "ring-2 ring-offset-2 ring-offset-panel-raised ring-hairline-strong" : ""
                }`}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2.5">
                  <span className="text-[16px] font-semibold text-ink">{e.title}</span>
                  <span className="font-mono text-[12px] text-ink-faint">{e.timestamp.replace("T", " ")}</span>
                </div>
                {e.detail && <p className="mt-1 text-[14px] leading-snug text-ink-dim">{e.detail}</p>}
                <span className="text-[12px] text-ink-faint">{e.actor}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
