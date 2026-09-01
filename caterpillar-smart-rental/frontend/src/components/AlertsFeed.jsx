import { useNavigate } from "react-router-dom";
import { SeverityPill } from "./StatusPill";
import { SEVERITY_EDGE } from "../lib/format";

export function AlertsFeed({ alerts }) {
  const navigate = useNavigate();
  return (
    <div className="border border-hairline bg-panel">
      <div className="border-b border-hairline px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        Alerts Feed
      </div>
      <ul className="max-h-80 divide-y divide-hairline overflow-y-auto">
        {alerts.length === 0 && (
          <li className="px-3 py-4 text-sm text-ink-faint">No active alerts.</li>
        )}
        {alerts.map((a) => (
          <li
            key={a.id}
            onClick={() => navigate(`/asset/${a.asset_id}`)}
            className={`cursor-pointer border-l-2 px-3 py-2.5 hover:bg-panel-raised ${SEVERITY_EDGE[a.severity]}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-ink">{a.asset_id}</span>
              <SeverityPill severity={a.severity} />
            </div>
            <p className="mt-1 text-[13px] leading-snug text-ink-dim">{a.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
