import { Link } from "react-router-dom";
import { SeverityPill } from "./StatusPill";
import { IconArrowRight } from "./icons";

const TYPE_LABEL = { reallocation: "Reallocate", maintenance: "Maintenance", assignment: "Assignment", allocation: "Allocate", return: "Return" };

export function RecommendationPanel({ recommendations, showAsset = false }) {
  if (!recommendations.length) {
    return <div className="border border-hairline bg-panel p-4 text-sm text-ink-faint">No open recommendations.</div>;
  }
  return (
    <div className="border border-hairline bg-panel">
      <div className="border-b border-hairline px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        Recommendations
      </div>
      <ul className="divide-y divide-hairline">
        {recommendations.map((r) => (
          <li key={r.id} className="px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wide text-signal-high">{TYPE_LABEL[r.type] ?? r.type}</span>
                <h3 className="text-sm font-medium text-ink">{r.title}</h3>
              </div>
              <SeverityPill severity={r.severity} />
            </div>
            <p className="mt-1 text-[13px] leading-snug text-ink-dim">{r.rationale}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[13px] text-ink">{r.action}</p>
              {showAsset && (
                <Link to={`/asset/${r.asset_id}`} className="flex shrink-0 items-center gap-1 text-[13px] text-signal-high hover:underline">
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
