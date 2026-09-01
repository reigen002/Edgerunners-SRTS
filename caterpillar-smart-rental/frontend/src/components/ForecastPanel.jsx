import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Link } from "react-router-dom";
import { IconTrend, IconArrowRight } from "./icons";

export function ForecastPanel({ forecast }) {
  if (!forecast) return null;
  const data = [
    ...forecast.history.map((h) => ({ period: h.period, count: h.count, kind: "history" })),
    ...forecast.forecast.map((f) => ({ period: f.period, count: f.count, kind: "forecast" })),
  ];
  const expectedNext = forecast.forecast[0].count;
  const supply = forecast.fillable_by.length;
  const gap = expectedNext - supply;
  const covered = gap <= 0;

  return (
    <div className="border border-hairline bg-panel shadow-[var(--shadow-panel)]">
      <div className="flex items-center gap-1.5 border-b border-hairline px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        <IconTrend /> Demand Forecast · {forecast.site_id} / {forecast.equipment_type}
      </div>

      <div className="p-3">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2f333d" vertical={false} />
            <XAxis dataKey="period" stroke="#656b78" fontSize={11} tickLine={false} axisLine={{ stroke: "#2f333d" }} />
            <YAxis stroke="#656b78" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#1c1f26", border: "1px solid #2f333d", fontSize: 12 }} cursor={{ fill: "#232732" }} />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.kind === "forecast" ? "#ffc72c" : "#5b9bd5"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-1 text-[11px] text-ink-faint">Method: {forecast.method}</p>
      </div>

      <div className={`grid grid-cols-2 divide-x divide-hairline border-t border-hairline ${covered ? "" : "bg-signal-high/[0.05]"}`}>
        <div className="px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Expected Next Month</div>
          <div className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-ink">{expectedNext} {forecast.equipment_type.toLowerCase()}{expectedNext === 1 ? "" : "s"}</div>
        </div>
        <div className="px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Available to Fill</div>
          <div className={`mt-0.5 font-mono text-lg font-semibold tabular-nums ${covered ? "text-signal-healthy" : "text-signal-high"}`}>
            {supply} on hand{!covered && ` · short ${gap}`}
          </div>
        </div>
      </div>

      {supply > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-hairline px-3 py-2">
          <span className="text-[11px] text-ink-faint">Fillable by</span>
          {forecast.fillable_by.map((f) => (
            <Link
              key={f.equipment_id}
              to={`/asset/${f.equipment_id}`}
              className="flex items-center gap-1 border border-signal-high/40 bg-signal-high/[0.06] px-2 py-0.5 font-mono text-[12px] text-signal-high hover:bg-signal-high/[0.12]"
            >
              {f.equipment_id} <IconArrowRight className="text-[10px]" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
