export function KpiTile({ label, value, tone = "default" }) {
  const toneClass = tone === "high" ? "text-signal-high" : "text-ink";
  return (
    <div className="border border-hairline bg-panel px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={`mt-1 font-mono text-2xl tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}
