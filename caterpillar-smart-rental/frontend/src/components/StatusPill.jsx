import { STATUS_LABEL, STATUS_TONE, SEVERITY_TONE, SEVERITY_BAR } from "../lib/format";

const DOT_TONE = {
  RENTED: "bg-ink-dim",
  RETURNED: "bg-signal-healthy",
  OVERDUE: "bg-signal-critical",
  APPROACHING_RETURN: "bg-signal-medium",
  UNASSIGNED: "bg-signal-high",
};

export function StatusPill({ status, size = "sm" }) {
  const pad = size === "lg" ? "px-2.5 py-1 text-[13px]" : "px-2 py-1 text-[12px]";
  return (
    <span className={`inline-flex items-center gap-1.5 border font-medium uppercase tracking-wide ${pad} ${STATUS_TONE[status]}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_TONE[status] ?? "bg-ink-faint"}`} />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function SeverityPill({ severity, size = "sm" }) {
  if (!severity) return null;
  const pad = size === "lg" ? "px-2.5 py-1 text-[13px]" : "px-2 py-1 text-[12px]";
  return (
    <span className={`inline-flex items-center gap-1.5 border font-semibold uppercase tracking-wide ${pad} ${SEVERITY_TONE[severity]}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_BAR[severity]}`} />
      {severity}
    </span>
  );
}
