import { Link } from "react-router-dom";
import { SeverityPill } from "./StatusPill";
import { SEVERITY_BAR } from "../lib/format";
import { IconArrowRight } from "./icons";

const TYPE_LABEL = { reallocation: "Reallocate", maintenance: "Maintenance", assignment: "Assignment", allocation: "Allocate", return: "Return" };

export function RecommendationPanel({ recommendations, showAsset = false }) {
  if (!recommendations.length) {
    return <div className="border border-hairline bg-panel p-4 text-sm text-ink-faint shadow-[var(--shadow-panel)]">No open recommendations.</div>;
  }
  return (
    <div className="border border-hairline bg-panel shadow-[var(--shadow-panel)]">
      <div className="border-b border-hairline px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        Recommendations · Decisions Ready for the Desk
      </div>
      <ul className="divide-y divide-hairline">
        {recommendations.map((r) => (
          <li key={r.id} className="relative py-3 pl-4 pr-3">
            <span className={`absolute inset-y-0 left-0 w-1 ${SEVERITY_BAR[r.severity] ?? "bg-hairline-strong"}`} />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-signal-high">{TYPE_LABEL[r.type] ?? r.type}</span>
                <h3 className="text-[15px] font-semibold leading-snug text-ink">{r.title}</h3>
              </div>
              <SeverityPill severity={r.severity} />
            </div>

            <p className="mt-1.5 text-[13px] leading-snug text-ink-dim">
              <span className="font-medium text-ink-faint">Why — </span>{r.rationale}
            </p>

            <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-hairline/70 pt-2">
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                <IconArrowRight className="shrink-0 text-signal-high" /> {r.action}
              </p>
              {showAsset && (
                <Link to={`/asset/${r.asset_id}`} className="flex shrink-0 items-center gap-1 border border-hairline-strong px-2 py-1 text-[12px] text-ink-dim hover:border-signal-high/50 hover:text-signal-high">
                  {r.asset_id} <IconArrowRight />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
