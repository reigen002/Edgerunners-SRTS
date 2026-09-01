export const STATUS_LABEL = {
  RENTED: "Rented",
  RETURNED: "Returned",
  OVERDUE: "Overdue",
  APPROACHING_RETURN: "Return Approaching",
  UNASSIGNED: "Unassigned",
};

// Tailwind class pairs keyed to the instrument-panel signal palette.
export const STATUS_TONE = {
  RENTED: "text-ink-dim bg-panel-raised border-hairline-strong",
  RETURNED: "text-signal-healthy bg-signal-healthy/10 border-signal-healthy/30",
  OVERDUE: "text-signal-high bg-signal-high/10 border-signal-high/40",
  APPROACHING_RETURN: "text-signal-medium bg-signal-medium/10 border-signal-medium/30",
  UNASSIGNED: "text-signal-high bg-signal-high/10 border-signal-high/40",
};

export const SEVERITY_TONE = {
  HIGH: "text-signal-high bg-signal-high/10 border-signal-high/40",
  MEDIUM: "text-signal-medium bg-signal-medium/10 border-signal-medium/30",
  LOW: "text-signal-low bg-signal-low/10 border-signal-low/30",
};

// Filled signal-bar device (not a CSS border) — the instrument-panel's own
// left-edge indicator, per the committed direction contract.
export const SEVERITY_BAR = {
  HIGH: "bg-signal-high",
  MEDIUM: "bg-signal-medium",
  LOW: "bg-signal-low",
};

// Subtle row/panel wash reserved for HIGH severity only — never a full-card wash.
export const SEVERITY_WASH = {
  HIGH: "bg-signal-high/[0.05]",
  MEDIUM: "",
  LOW: "",
};

export const SEVERITY_TEXT = {
  HIGH: "text-signal-high",
  MEDIUM: "text-signal-medium",
  LOW: "text-signal-low",
};

export function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${m}/${d}/${y}`;
}

export function anomalyLabel(code) {
  return code
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

// Operational framing only — never a data claim. Explains why the condition matters,
// not what happened (that's `evidence`, sourced from real asset/telemetry values).
export const ANOMALY_CONSEQUENCE = {
  missing_site: "Cannot be located or billed against a job without a site of record.",
  missing_operator: "No accountable operator on record if the machine is damaged or misused.",
  zero_productive: "Sits under a rental contract while earning no productive hours.",
  low_utilization: "Rental value is not being realized; a fillable demand elsewhere goes unmet.",
  excessive_idle: "Idle hours burn fuel and wear components without productive output.",
  overdue_return: "Blocks reallocation and keeps billing a customer for a machine likely no longer in use.",
  return_approaching: "Turnaround plan needed before the machine is due back at the yard.",
  engine_overheat: "Continued operation risks engine damage and unplanned downtime.",
  unsafe_seatbelt: "Operator is exposed to injury risk while the machine is running.",
  abnormal_fuel: "Elevated burn suggests a leak or inefficiency worth inspecting before it compounds.",
};
