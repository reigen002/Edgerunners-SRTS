import { SeverityPill } from "./StatusPill";
import { SEVERITY_EDGE } from "../lib/format";

export function AnomalyCard({ anomaly }) {
  return (
    <div className={`border border-hairline border-l-2 bg-panel p-3 ${SEVERITY_EDGE[anomaly.severity]}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-ink">{anomaly.condition}</h3>
        <SeverityPill severity={anomaly.severity} />
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-ink-dim">{anomaly.evidence}</p>
      <p className="mt-2 text-[13px] leading-snug text-signal-high">→ {anomaly.recommended_action}</p>
    </div>
  );
}
