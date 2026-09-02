import { SeverityPill } from "./StatusPill";
import { SEVERITY_BORDER, SEVERITY_WASH, SEVERITY_TEXT, ANOMALY_CONSEQUENCE } from "../lib/format";
import { IconArrowRight } from "./icons";

function Row({ label, children, tone = "text-ink-dim" }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3 py-2 first:pt-0 last:pb-0">
      <div className="pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={`text-[14px] leading-snug ${tone}`}>{children}</div>
    </div>
  );
}

export function AnomalyCard({ anomaly }) {
  const isHigh = anomaly.severity === "HIGH" || anomaly.severity === "CRITICAL";

  const consequence = ANOMALY_CONSEQUENCE[anomaly.code];

  return (
    <div
      className={`border bg-panel px-4 py-3.5 shadow-[var(--shadow-panel)] ${SEVERITY_BORDER[anomaly.severity] ?? "border-hairline"} ${SEVERITY_WASH[anomaly.severity]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold leading-snug text-ink">{anomaly.condition}</h3>
        <SeverityPill severity={anomaly.severity} />
      </div>
      <div className="mt-2 divide-y divide-hairline/60">
        <Row label="Evidence">{anomaly.evidence}</Row>
        {consequence && <Row label="Why it matters">{consequence}</Row>}
        {anomaly.recommended_action && (
          <Row label="Action" tone={isHigh ? `font-medium ${SEVERITY_TEXT[anomaly.severity]}` : "text-ink-dim"}>
            <span className="inline-flex items-center gap-1.5">
              {anomaly.recommended_action} <IconArrowRight className="shrink-0 text-[12px]" />
            </span>
          </Row>
        )}
      </div>
    </div>
  );
}
