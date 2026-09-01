import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusPill, SeverityPill } from "./StatusPill";
import { SEVERITY_BAR, SEVERITY_WASH } from "../lib/format";
import { ANOMALY_THRESHOLDS as T } from "../mock/seed";

const severityRank = { HIGH: 0, MEDIUM: 1, LOW: 2, null: 3 };
const columns = [
  { key: "equipment_id", label: "Asset" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "site_name", label: "Site" },
  { key: "operator_name", label: "Operator" },
  { key: "utilization_pct", label: "Util." },
  { key: "idle_hours_per_day", label: "Idle hrs/day" },
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
        av = severityRank[a.highest_severity];
        bv = severityRank[b.highest_severity];
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
      <div className="flex items-center justify-between border-b border-hairline px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        <span>Fleet</span>
        <span>{assets.length} assets · sorted by severity</span>
      </div>
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                onClick={() => toggleSort(c.key)}
                className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint hover:text-ink-dim"
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
              className={`relative cursor-pointer border-b border-hairline last:border-b-0 hover:bg-panel-raised ${SEVERITY_WASH[a.highest_severity] ?? ""}`}
            >
              <td className="relative whitespace-nowrap px-3 py-2.5 font-mono font-medium text-ink">
                <span className={`absolute inset-y-0 left-0 w-1 ${SEVERITY_BAR[a.highest_severity] ?? "bg-transparent"}`} />
                <span className="pl-1.5">{a.equipment_id}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-ink-dim">{a.type}</td>
              <td className="whitespace-nowrap px-3 py-2.5"><StatusPill status={a.status} /></td>
              <td className="whitespace-nowrap px-3 py-2.5 text-ink-dim">
                {a.site_name ?? <span className="text-signal-high">Unassigned</span>}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-ink-dim">
                {a.operator_name ?? <span className="text-signal-high">Unassigned</span>}
              </td>
              <td className={`whitespace-nowrap px-3 py-2.5 font-mono tabular-nums ${utilTone(a.utilization_pct)}`}>{a.utilization_pct}%</td>
              <td className={`whitespace-nowrap px-3 py-2.5 font-mono tabular-nums ${idleTone(a.idle_hours_per_day)}`}>{a.idle_hours_per_day}</td>
              <td className="whitespace-nowrap px-3 py-2.5">
                {a.anomaly_count > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <SeverityPill severity={a.highest_severity} /> <span className="text-[12px] text-ink-faint">×{a.anomaly_count}</span>
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
