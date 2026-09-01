import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Link } from "react-router-dom";
import { formatDate } from "../lib/format";
import { IconTrend, IconArrowRight } from "./icons";

export function ForecastPanel({ forecast }) {
  if (!forecast) return null;
  const data = [
    ...forecast.history.map((h) => ({ period: h.period, demand: h.demand, kind: "history" })),
    ...forecast.forecast.map((f) => ({ period: f.period, demand: f.demand, kind: "forecast" })),
  ];
  const returning = forecast.expected_returning ?? [];

  return (
    <div className="border border-hairline bg-panel shadow-[var(--shadow-panel)]">
      <div className="flex items-center gap-1.5 border-b border-hairline px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        <IconTrend /> Demand Forecast · {forecast.equipment_type}{forecast.site_id ? ` / ${forecast.site_id}` : ""}
      </div>

      <div className="p-3">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2f333d" vertical={false} />
            <XAxis dataKey="period" stroke="#656b78" fontSize={11} tickLine={false} axisLine={{ stroke: "#2f333d" }} />
            <YAxis stroke="#656b78" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#1c1f26", border: "1px solid #2f333d", fontSize: 12 }} cursor={{ fill: "#232732" }} />
            <Bar dataKey="demand" radius={[2, 2, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.kind === "forecast" ? "#ffc72c" : "#5b9bd5"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-1 text-[11px] text-ink-faint">Planning estimate — moving-average trend, not predictive ML.</p>
      </div>

      <div className="border-t border-hairline px-3 py-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Recommended Fleet Size</div>
        <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-ink">{forecast.recommended_allocation} unit{forecast.recommended_allocation === 1 ? "" : "s"}</div>
        <p className="mt-1 text-[13px] leading-snug text-ink-dim">{forecast.allocation_rationale}</p>
      </div>

      {forecast.projected_gap != null && (
        <div className="border-t border-hairline px-3 py-2.5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
            {[
              ["Forecast demand", forecast.peak_forecast_demand],
              ["Available supply", forecast.supply_available],
              ["Recoverable supply", forecast.supply_recoverable],
              ["Known supply", forecast.supply_total_known],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
                <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-ink">{value}</div>
              </div>
            ))}
          </div>
          <div className={`mt-2 font-mono text-sm font-semibold ${forecast.projected_gap > 0 ? "text-signal-high" : "text-signal-healthy"}`}>
            Projected gap: {forecast.projected_gap} unit{forecast.projected_gap === 1 ? "" : "s"}
          </div>
        </div>
      )}

      {forecast.allocation_candidates?.length > 0 && (
        <div className="border-t border-hairline px-3 py-2.5 space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Recommended Action</div>
          {forecast.allocation_candidates.map((c) => (
            <Link
              key={c.asset_id}
              to={`/asset/${c.asset_id}`}
              className="flex items-center gap-1.5 text-[13px] font-medium text-ink hover:text-signal-high"
            >
              <IconArrowRight className="shrink-0 text-signal-high" /> {c.action}
            </Link>
          ))}
          {forecast.projected_gap > 0 && (
            <p className="text-[12px] text-ink-faint">
              After recovery, {forecast.projected_gap} unit{forecast.projected_gap === 1 ? "" : "s"} of demand remains uncovered.
            </p>
          )}
        </div>
      )}

      {returning.length > 0 && (
        <div className="border-t border-hairline px-3 py-2">
          <div className="mb-1.5 text-[11px] text-ink-faint">Expected returning — could cover the next period</div>
          <div className="flex flex-wrap items-center gap-1.5">
            {returning.map((r) => (
              <Link
                key={r.asset_id}
                to={`/asset/${r.asset_id}`}
                className="flex items-center gap-1 border border-signal-high/40 bg-signal-high/[0.06] px-2 py-0.5 font-mono text-[12px] text-signal-high hover:bg-signal-high/[0.12]"
                title={r.expected_return_date ? `Expected back ${formatDate(r.expected_return_date)}` : undefined}
              >
                {r.asset_id} <IconArrowRight className="text-[10px]" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
