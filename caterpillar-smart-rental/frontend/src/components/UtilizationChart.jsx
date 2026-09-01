import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function UtilizationChart({ engineHoursPerDay, idleHoursPerDay }) {
  const data = [{ name: "hrs/day", Engine: engineHoursPerDay, Idle: idleHoursPerDay }];
  return (
    <div className="border border-hairline bg-panel p-4 shadow-[var(--shadow-panel)]">
      <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Engine vs. Idle Hours / Day</div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2f333d" horizontal={false} />
          <XAxis type="number" stroke="#656b78" fontSize={11} tickLine={false} axisLine={{ stroke: "#2f333d" }} />
          <YAxis type="category" dataKey="name" stroke="#656b78" fontSize={11} tickLine={false} axisLine={false} width={56} />
          <Tooltip contentStyle={{ background: "#1c1f26", border: "1px solid #2f333d", fontSize: 12 }} cursor={{ fill: "#232732" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Engine" fill="#3ecf8e" barSize={22} />
          <Bar dataKey="Idle" fill="#ffc72c" barSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
