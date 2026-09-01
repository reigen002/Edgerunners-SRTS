import { Link } from "react-router-dom";
import { StatusPill, SeverityPill } from "./StatusPill";
import { SEVERITY_BORDER, SEVERITY_TEXT, SEVERITY_WASH } from "../lib/format";
import { IconArrowRight, IconAlert } from "./icons";

export function HeroAssetPanel({ asset, recommendation }) {
  if (!asset) return null;
  const tone = SEVERITY_TEXT[asset.highest_severity] ?? "text-signal-high";
  const border = SEVERITY_BORDER[asset.highest_severity] ?? "border-signal-high/35";
  const wash = SEVERITY_WASH[asset.highest_severity] ?? "bg-signal-high/[0.04]";

  return (
    <div className={`border bg-panel shadow-[var(--shadow-hero)] ${border}`}>
      <div className={`flex items-center gap-2 border-b px-5 py-2 text-[12px] font-semibold uppercase tracking-wide ${border} ${wash} ${tone}`}>
        <IconAlert className="text-[14px]" /> Fleet-wide priority
      </div>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[28px] font-bold leading-none text-ink">{asset.equipment_id}</span>
            <StatusPill status={asset.status} size="lg" />
            <SeverityPill severity={asset.highest_severity} size="lg" />
          </div>
          <p className="mt-2 max-w-2xl text-[14px] leading-snug text-ink-dim">
            {asset.type} · {asset.anomaly_count} open anomal{asset.anomaly_count === 1 ? "y" : "ies"}.{" "}
            {asset.top_anomaly?.summary}
          </p>
          {asset.idle_hours_per_day > 0 && asset.utilization_pct === 0 && (
            <p className="mt-1.5 text-[13px] text-ink-faint">
              {asset.idle_hours_per_day} idle hrs/day identified as recoverable utilization opportunity.
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 sm:pl-5">
          {recommendation && (
            <div className="hidden max-w-xs border-l border-hairline pl-4 text-[14px] text-ink-dim md:block">
              <span className="font-medium text-ink-faint">Recommended — </span>{recommendation.recommendation}
            </div>
          )}
          <Link
            to={`/asset/${asset.equipment_id}`}
            className="flex shrink-0 items-center gap-1.5 bg-signal-high px-3.5 py-2.5 text-[14px] font-semibold text-signal-high-ink hover:brightness-95"
          >
            Review evidence <IconArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
