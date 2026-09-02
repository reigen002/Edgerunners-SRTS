import { useNavigate } from "react-router-dom";
import { SeverityPill } from "./StatusPill";
import { SEVERITY_WASH } from "../lib/format";

function AlertRow({ a, navigate, prominent }) {
  return (
    <li
      key={a.id}
      onClick={() => navigate(`/asset/${a.asset_id}`)}
      className={`cursor-pointer px-4 py-3 hover:bg-panel-raised ${SEVERITY_WASH[a.severity] ?? ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[13px] font-medium text-ink">{a.asset_id}</span>
        <SeverityPill severity={a.severity} />
      </div>
      <p className={`mt-1.5 leading-snug text-ink-dim ${prominent ? "text-[14px]" : "text-[13px]"}`}>{a.message}</p>
    </li>
  );
}

export function AlertsFeed({ alerts }) {
  const navigate = useNavigate();
  const high = alerts.filter((a) => a.severity === "HIGH" || a.severity === "CRITICAL");
  const rest = alerts.filter((a) => a.severity !== "HIGH" && a.severity !== "CRITICAL");

  return (
    <div className="border border-hairline bg-panel shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
        <span>Alerts Feed</span>
        {high.length > 0 && <span className="text-signal-critical">{high.length} urgent</span>}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 && (
          <p className="px-4 py-5 text-sm text-ink-faint">No active alerts.</p>
        )}
        {high.length > 0 && (
          <ul className="divide-y divide-ink-faint">
            {high.map((a) => <AlertRow key={a.id} a={a} navigate={navigate} prominent />)}
          </ul>
        )}
        {rest.length > 0 && (
          <>
            <div className="border-t border-hairline px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Lower priority
            </div>
            <ul className="divide-y divide-ink-faint">
              {rest.map((a) => <AlertRow key={a.id} a={a} navigate={navigate} />)}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
