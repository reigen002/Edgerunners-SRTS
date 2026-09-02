import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusPill, SeverityPill } from "./StatusPill";
import { SEVERITY_TEXT, SEVERITY_WASH, SEVERITY_RANK, DISPLAY_THRESHOLDS as T } from "../lib/format";

const columns = [
  { key: "equipment_id", label: "Asset" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "site_name", label: "Site" },
  { key: "operator_name", label: "Operator" },
  { key: "utilization_pct", label: "Util." },
  { key: "idle_hours_per_day", label: "Idle/Day" },
  { key: "highest_severity", label: "Alerts" },
];

function utilTone(pct) {
  if (pct < T.low_utilization_severe_pct) return "text-signal-high font-semibold";
  if (pct < T.low_utilization_pct) return "text-signal-medium";
  return "text-ink-dim";
}

function idleTone(hrs) {
  if (hrs >= T.excessive_idle_severe_hours) return "text-signal-high font-semibold";
  if (hrs >= T.excessive_idle_hours) return "text-signal-medium";
  return "text-ink-dim";
}

export function FleetTable({ assets }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState("highest_severity");
  const [sortDir, setSortDir] = useState(1);

  const sorted = useMemo(() => {
    const list = [...assets];
    list.sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (sortKey === "highest_severity") {
        av = SEVERITY_RANK[a.highest_severity] ?? 3;
        bv = SEVERITY_RANK[b.highest_severity] ?? 3;
      }
      if (av == null) av = "";
      if (bv == null) bv = "";
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
    return list;
  }, [assets, sortKey, sortDir]);

  function toggleSort(key) {
    if (key === sortKey) setSortDir((d) => -d);
    else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  return (
    <div className="overflow-x-auto border border-hairline bg-panel shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
        <span>Fleet</span>
        <span>{assets.length} assets · sorted by severity</span>
      </div>
      <table className="w-full min-w-[780px] border-collapse text-[14px]">
        <thead>
          <tr className="border-b border-hairline text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                onClick={() => toggleSort(c.key)}
                className="cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-faint hover:text-ink-dim"
              >
                {c.label}{sortKey === c.key ? (sortDir === 1 ? " ↑" : " ↓") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr
              key={a.equipment_id}
              onClick={() => navigate(`/asset/${a.equipment_id}`)}
              className={`cursor-pointer border-b border-ink-faint last:border-b-0 hover:bg-panel-raised ${SEVERITY_WASH[a.highest_severity] ?? ""}`}
            >
              <td className={`whitespace-nowrap px-3 py-3 font-mono font-semibold ${a.anomaly_count > 0 ? SEVERITY_TEXT[a.highest_severity] : "text-ink"}`}>
                {a.equipment_id}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-ink-dim">{a.type}</td>
              <td className="whitespace-nowrap px-3 py-3"><StatusPill status={a.status} /></td>
              <td className="whitespace-nowrap px-3 py-3 text-ink-dim">
                {a.site_name ?? <span className="text-signal-high">Unassigned</span>}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-ink-dim">
                {a.operator_name ?? <span className="text-signal-high">Unassigned</span>}
              </td>
              <td className={`whitespace-nowrap px-3 py-3 font-mono tabular-nums ${utilTone(a.utilization_pct)}`}>{a.utilization_pct}%</td>
              <td className={`whitespace-nowrap px-3 py-3 font-mono tabular-nums ${idleTone(a.idle_hours_per_day)}`}>{a.idle_hours_per_day}</td>
              <td className="whitespace-nowrap px-3 py-3">
                {a.anomaly_count > 0 ? (
                  <span className="inline-flex items-center gap-2">
                    <SeverityPill severity={a.highest_severity} /> <span className="text-[12.5px] text-ink-faint">×{a.anomaly_count}</span>
                  </span>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
