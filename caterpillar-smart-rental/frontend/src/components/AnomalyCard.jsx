import { SeverityPill } from "./StatusPill";
import { SEVERITY_BAR, SEVERITY_WASH, ANOMALY_CONSEQUENCE } from "../lib/format";
import { IconArrowRight } from "./icons";

function Row({ label, children, tone = "text-ink-dim" }) {
  return (
    <div className="grid grid-cols-[64px_1fr] gap-3 py-1.5 first:pt-0 last:pb-0">
      <div className="pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={`text-[13px] leading-snug ${tone}`}>{children}</div>
    </div>
  );
}

export function AnomalyCard({ anomaly }) {
  const isHigh = anomaly.severity === "HIGH" || anomaly.severity === "CRITICAL";
  const consequence = ANOMALY_CONSEQUENCE[anomaly.code];

  return (
    <div
      className={`relative overflow-hidden border bg-panel pl-4 pr-3 py-2.5 shadow-[var(--shadow-panel)] ${
        isHigh ? "border-signal-high/30" : "border-hairline"
      } ${SEVERITY_WASH[anomaly.severity]}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${SEVERITY_BAR[anomaly.severity]}`} />
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-ink">{anomaly.condition}</h3>
        <SeverityPill severity={anomaly.severity} />
      </div>
      <div className="mt-1.5 divide-y divide-hairline/60">
        <Row label="Evidence">{anomaly.evidence}</Row>
        {consequence && <Row label="Why it matters">{consequence}</Row>}
        {anomaly.recommended_action && (
          <Row label="Action" tone={isHigh ? "font-medium text-signal-high" : "text-ink-dim"}>
            <span className="inline-flex items-center gap-1">
              {anomaly.recommended_action} <IconArrowRight className="shrink-0 text-[11px]" />
            </span>
          </Row>
        )}
      </div>
    </div>
  );
}
