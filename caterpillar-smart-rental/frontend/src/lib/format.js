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

export const SEVERITY_EDGE = {
  HIGH: "border-l-signal-high",
  MEDIUM: "border-l-signal-medium",
  LOW: "border-l-signal-low",
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
