import { Link } from "react-router-dom";
import { StatusPill, SeverityPill } from "./StatusPill";
import { IconArrowRight, IconAlert } from "./icons";

export function HeroAssetPanel({ asset, recommendation }) {
  if (!asset) return null;

  return (
    <div className="relative overflow-hidden border border-signal-high/35 bg-panel shadow-[var(--shadow-hero)]">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-signal-high" />
      <div className="flex items-center gap-1.5 border-b border-signal-high/20 bg-signal-high/[0.04] px-4 py-1.5 pl-6 text-[11px] font-semibold uppercase tracking-wide text-signal-high">
        <IconAlert className="text-[13px]" /> Fleet-wide priority
      </div>
      <div className="flex flex-col gap-4 p-4 pl-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-2xl font-bold leading-none text-ink">{asset.equipment_id}</span>
            <StatusPill status={asset.status} size="lg" />
            <SeverityPill severity={asset.highest_severity} size="lg" />
          </div>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-snug text-ink-dim">
            {asset.type} · {asset.anomaly_count} open anomal{asset.anomaly_count === 1 ? "y" : "ies"}.{" "}
            {asset.top_anomaly?.summary}
          </p>
          {asset.idle_hours_per_day > 0 && asset.utilization_pct === 0 && (
            <p className="mt-1 text-[12px] text-ink-faint">
              {asset.idle_hours_per_day} idle hrs/day identified as recoverable utilization opportunity.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 sm:pl-4">
          {recommendation && (
            <div className="hidden max-w-xs border-l border-hairline pl-4 text-[13px] text-ink-dim md:block">
              <span className="font-medium text-ink-faint">Recommended — </span>{recommendation.recommendation}
            </div>
          )}
          <Link
            to={`/asset/${asset.equipment_id}`}
            className="flex shrink-0 items-center gap-1.5 bg-signal-high px-3 py-2 text-[13px] font-semibold text-signal-high-ink hover:brightness-95"
          >
            Review evidence <IconArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
