import { Link } from "react-router-dom";
import { SeverityPill } from "./StatusPill";
import { SEVERITY_WASH } from "../lib/format";
import { IconArrowRight } from "./icons";

export function RecommendationPanel({ recommendations, showAsset = false }) {
  if (!recommendations.length) {
    return <div className="border border-hairline bg-panel p-5 text-sm text-ink-faint shadow-[var(--shadow-panel)]">No open recommendations.</div>;
  }
  return (
    <div className="border border-hairline bg-panel shadow-[var(--shadow-panel)]">
      <div className="border-b border-hairline px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
        Recommendations
      </div>
      <ul className="divide-y divide-hairline">
        {recommendations.map((r) => {
          const isAllocation = r.issue?.startsWith("Forecast demand gap");
          return (
          <li key={r.id} className={`px-4 py-4 ${SEVERITY_WASH[r.severity] ?? ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`text-[11px] font-semibold uppercase tracking-wide ${isAllocation ? "text-signal-low" : "text-ink-faint"}`}>
                  {isAllocation ? "Allocation — what to do with the fleet" : "Anomaly — what went wrong"}
                </span>
                <h3 className="mt-0.5 text-[16px] font-semibold leading-snug text-ink">{r.issue}</h3>
              </div>
              <SeverityPill severity={r.severity} />
            </div>

            <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
              <span className="font-medium text-ink-faint">Why — </span>{r.evidence}
            </p>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-hairline/70 pt-2.5">
              <p className="flex items-center gap-2 text-[14px] font-medium text-ink">
                <IconArrowRight className="shrink-0 text-signal-high" /> {r.recommendation}
              </p>
              {showAsset && (
                <Link to={`/asset/${r.asset_id}`} className="flex shrink-0 items-center gap-1 border border-hairline-strong px-2.5 py-1 text-[12px] text-ink-dim hover:border-signal-high/50 hover:text-signal-high">
                  {r.asset_id} <IconArrowRight />
                </Link>
              )}
            </div>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
