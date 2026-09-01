import { IconBelt, IconCheck } from "./icons";
import { COACHING } from "../mock/seed";

export function SafetyCoaching({ code }) {
  const content = COACHING[code];
  if (!content) return null;
  return (
    <div className="border border-signal-high/40 bg-signal-high/[0.06] p-3 shadow-[var(--shadow-panel)]">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-signal-high">
        <IconBelt /> {content.title}
      </div>
      <ul className="mt-2 space-y-1.5">
        {content.checklist.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] text-ink-dim">
            <IconCheck className="mt-0.5 shrink-0 text-signal-high" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
