import { STATUS_LABEL, STATUS_TONE, SEVERITY_TONE } from "../lib/format";

export function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${STATUS_TONE[status]}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function SeverityPill({ severity }) {
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${SEVERITY_TONE[severity]}`}>
      {severity}
    </span>
  );
}
