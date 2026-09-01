const TONE_TEXT = { high: "text-signal-high", healthy: "text-signal-healthy", default: "text-ink" };

// A single fused instrument cluster (not a grid of identical cards) — reads as
// one gauge strip, not four repeated stat tiles.
export function KpiCluster({ items }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-hairline border border-hairline bg-panel shadow-[var(--shadow-panel)] sm:grid-cols-4 sm:divide-y-0">
      {items.map(({ label, value, tone = "default" }) => (
        <div key={label} className="px-4 py-3">
          <div className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</div>
          <div className={`mt-1 font-mono text-[26px] font-semibold leading-none tabular-nums ${TONE_TEXT[tone]}`}>{value}</div>
        </div>
      ))}
    </div>
  );
}
