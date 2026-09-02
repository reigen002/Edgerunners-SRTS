import { Link } from "react-router-dom";
import { SeverityPill } from "./StatusPill";
import { SEVERITY_WASH, SEVERITY_BORDER, SEVERITY_RANK, isAllocationRec } from "../lib/format";
import { IconArrowRight } from "./icons";

function RecCard({ r, showAsset }) {
  const isAllocation = isAllocationRec(r);
  return (
    <li
      className={`border px-4 py-3.5 shadow-[var(--shadow-panel)] ${SEVERITY_BORDER[r.severity] ?? "border-hairline"} ${SEVERITY_WASH[r.severity] ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={`inline-block border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              isAllocation ? "border-signal-low/40 text-signal-low" : "border-hairline-strong text-ink-dim"
            }`}
          >
            {isAllocation ? "Allocation" : "Anomaly"}
          </span>
          <h3 className="mt-1 text-[16px] font-semibold leading-snug text-ink">{r.issue}</h3>
        </div>
        <SeverityPill severity={r.severity} />
      </div>

      <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
        <span className="font-medium text-ink-faint">Why — </span>{r.evidence}
      </p>

      <div className="mt-3 flex items-center justify-between gap-3">
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
}

export function RecommendationPanel({ recommendations, showAsset = false }) {
  if (!recommendations.length) {
    return <div className="border border-hairline bg-panel p-5 text-sm text-ink-faint shadow-[var(--shadow-panel)]">No open recommendations.</div>;
  }

  const sorted = [...recommendations].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  const anomalies = sorted.filter((r) => !isAllocationRec(r));
  const allocations = sorted.filter(isAllocationRec);

  return (
    <div className="border border-hairline bg-panel shadow-[var(--shadow-panel)]">
      <div className="border-b border-hairline px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
        Recommendations
      </div>
      <div className="space-y-4 p-3">
        {anomalies.length > 0 && (
          <div className="space-y-2.5">
            {allocations.length > 0 && (
              <div className="px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Anomalies — what went wrong</div>
            )}
            <ul className="space-y-2.5">
              {anomalies.map((r) => <RecCard key={r.id} r={r} showAsset={showAsset} />)}
            </ul>
          </div>
        )}
        {allocations.length > 0 && (
          <div className="space-y-2.5">
            {anomalies.length > 0 && (
              <div className="px-1 text-[11px] font-semibold uppercase tracking-wide text-signal-low">Allocation — what to do with the fleet</div>
            )}
            <ul className="space-y-2.5">
              {allocations.map((r) => <RecCard key={r.id} r={r} showAsset={showAsset} />)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
