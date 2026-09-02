export const STATUS_LABEL = {
  RENTED: "Rented",
  RETURNED: "Returned",
  OVERDUE: "Overdue",
  APPROACHING_RETURN: "Return Approaching",
  UNASSIGNED: "Unassigned",
  MAINTENANCE: "Maintenance",
};

// Tailwind class pairs keyed to the instrument-panel signal palette.
export const STATUS_TONE = {
  RENTED: "text-ink-dim bg-panel-raised border-hairline-strong",
  RETURNED: "text-signal-healthy bg-signal-healthy/10 border-signal-healthy/30",
  OVERDUE: "text-signal-critical bg-signal-critical/10 border-signal-critical/45",
  APPROACHING_RETURN: "text-signal-medium bg-signal-medium/10 border-signal-medium/30",
  UNASSIGNED: "text-signal-high bg-signal-high/10 border-signal-high/40",
  MAINTENANCE: "text-signal-medium bg-signal-medium/10 border-signal-medium/30",
};

// Backend severities are LOW|MEDIUM|HIGH|CRITICAL. CRITICAL now carries its
// own alarm-red signal, distinct from HIGH's safety yellow — a real gauge
// cluster never collapses "caution" and "alarm" into one lamp color, and a
// single accent for both read as flat/generic. Action controls (Check In,
// Run Scenario, Reset Demo) stay on brand-yellow regardless of severity —
// that's the product's action color, a different job from status signaling.
export const SEVERITY_TONE = {
  CRITICAL: "text-signal-critical bg-signal-critical/10 border-signal-critical/45",
  HIGH: "text-signal-high bg-signal-high/10 border-signal-high/40",
  MEDIUM: "text-signal-medium bg-signal-medium/10 border-signal-medium/30",
  LOW: "text-signal-low bg-signal-low/10 border-signal-low/30",
};

// Filled signal-dot device (small circular indicator only — never a colored
// border-left/right bar) for pills and gauge markers.
export const SEVERITY_BAR = {
  CRITICAL: "bg-signal-critical",
  HIGH: "bg-signal-high",
  MEDIUM: "bg-signal-medium",
  LOW: "bg-signal-low",
};

// Severity-tinted card/row frame — replaces a decorative edge bar with a
// colored 1px border, so the card's own outline carries the signal.
export const SEVERITY_BORDER = {
  CRITICAL: "border-signal-critical/45",
  HIGH: "border-signal-high/35",
  MEDIUM: "border-signal-medium/30",
  LOW: "border-hairline",
};

// Row/panel wash, one step per tier so CRITICAL/HIGH/MEDIUM/LOW are each
// perceptibly different (a flat 5-6% on only the top two tiers reads as
// "no wash at all" against the dark panel).
export const SEVERITY_WASH = {
  CRITICAL: "bg-signal-critical/[0.14]",
  HIGH: "bg-signal-high/[0.10]",
  MEDIUM: "bg-signal-medium/[0.07]",
  LOW: "bg-signal-low/[0.05]",
};

export const SEVERITY_TEXT = {
  CRITICAL: "text-signal-critical",
  HIGH: "text-signal-high",
  MEDIUM: "text-signal-medium",
  LOW: "text-signal-low",
};

// CRITICAL first. Used to sort any list of severity-bearing items
// (recommendations, assets) so the worst item leads.
export const SEVERITY_RANK = { CRITICAL: -1, HIGH: 0, MEDIUM: 1, LOW: 2 };

// A recommendation is either "what to do with the fleet" (allocation) or
// "what went wrong" (anomaly) — the backend doesn't tag this, so both call
// sites keyed off the same issue-text prefix. Centralized here so the check
// can't drift between them.
export function isAllocationRec(r) {
  return !!r.issue?.startsWith("Forecast demand gap");
}

// Mirrors the backend's fixed clock (app/clock.py DEMO_NOW_DEFAULT). The
// backend never exposes it on an endpoint, so date-relative UI logic
// (overdue/approaching-return coloring, the header clock) anchors to the
// same constant rather than the real system date.
export const REAL_DEMO_NOW = "2025-05-12T00:00:00Z";

// Display-coloring cutoffs shared by mock detection (mock/engine.js) and by
// real-mode components that color a raw number without re-deriving an
// anomaly (e.g. FleetTable's Util./Idle columns). Not a detection rule set
// on its own — the backend owns detection in real mode.
export const DISPLAY_THRESHOLDS = {
  low_utilization_pct: 30,
  low_utilization_severe_pct: 10,
  excessive_idle_hours: 6,
  excessive_idle_severe_hours: 10,
  return_approaching_days: 5,
  engine_overheat_c: 105,
  abnormal_fuel_lph: 25,
  location_mismatch_km: 5,
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

  // Backend alert_type vocabulary (real API mode) — same framing, different keys.
  no_site: "Cannot be located or billed against a job without a site of record.",
  no_operator: "No accountable operator on record if the machine is damaged or misused.",
  high_idle: "Idle hours burn fuel and wear components without productive output.",
  overdue: "Blocks reallocation and keeps billing a customer for a machine likely no longer in use.",
  seatbelt_violation: "Operator is exposed to injury risk while the machine is running.",
  location_mismatch: "Asset is reporting outside its registered site boundary — possible misuse or misplacement.",
};
