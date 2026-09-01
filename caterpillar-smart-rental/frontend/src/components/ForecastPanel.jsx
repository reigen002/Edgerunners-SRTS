import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { IconTrend } from "./icons";

export function ForecastPanel({ forecast }) {
  if (!forecast) return null;
  const data = [
    ...forecast.history.map((h) => ({ period: h.period, count: h.count, kind: "history" })),
    ...forecast.forecast.map((f) => ({ period: f.period, count: f.count, kind: "forecast" })),
  ];

  return (
    <div className="border border-hairline bg-panel p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          <IconTrend /> Demand Forecast · {forecast.site_id} / {forecast.equipment_type}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
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
      <p className="mt-1 text-[13px] text-ink-dim">{forecast.expected_requirement}</p>
      <p className="text-[11px] text-ink-faint">Method: {forecast.method}</p>
      {forecast.fillable_by.length > 0 && (
        <div className="mt-2 border-t border-hairline pt-2 text-[13px] text-ink-dim">
          Fillable by: {forecast.fillable_by.map((f) => f.equipment_id).join(", ")}
        </div>
      )}
    </div>
  );
}
