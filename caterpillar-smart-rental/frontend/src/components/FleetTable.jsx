import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusPill } from "./StatusPill";
import { SEVERITY_EDGE } from "../lib/format";

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
    <div className="overflow-x-auto border border-hairline bg-panel">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                onClick={() => toggleSort(c.key)}
                className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint hover:text-ink-dim"
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
              className={`cursor-pointer border-b border-hairline border-l-2 last:border-b-0 hover:bg-panel-raised ${SEVERITY_EDGE[a.highest_severity] ?? "border-l-transparent"}`}
            >
              <td className="whitespace-nowrap px-3 py-2 font-mono text-ink">{a.equipment_id}</td>
              <td className="whitespace-nowrap px-3 py-2 text-ink-dim">{a.type}</td>
              <td className="whitespace-nowrap px-3 py-2"><StatusPill status={a.status} /></td>
              <td className="whitespace-nowrap px-3 py-2 text-ink-dim">{a.site_name ?? "Unassigned"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-ink-dim">{a.operator_name ?? "Unassigned"}</td>
              <td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums text-ink-dim">{a.utilization_pct}%</td>
              <td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums text-ink-dim">{a.idle_hours_per_day}</td>
              <td className="whitespace-nowrap px-3 py-2 text-ink-dim">
                {a.anomaly_count > 0 ? `${a.anomaly_count} · ${a.highest_severity}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
