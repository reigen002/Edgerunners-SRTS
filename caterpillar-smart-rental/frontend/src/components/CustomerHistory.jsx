import { formatDate } from "../lib/format";
import { IconTruck } from "./icons";

// One row per rental engagement, not one row per raw event — pairs each
// CHECKOUT with the CHECKIN that closes it (or leaves it open as "current").
// Lifecycle Timeline stays the full technical audit trail; this is the
// commercial view an evaluator/dealer actually asks for: who had it, where
// it went, when.
function rentalCycles(events) {
  const sorted = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const cycles = [];
  let open = null;
  for (const e of sorted) {
    if (e.type === "CHECKOUT") {
      open = { id: e.id, customer_name: e.customer_name, site_name: e.site_name, site_address: e.site_address, checked_out: e.timestamp, returned: null };
      cycles.push(open);
    } else if (e.type === "CHECKIN" && open) {
      open.returned = e.timestamp;
      open = null;
    }
  }
  return cycles.reverse();
}

export function CustomerHistory({ events }) {
  const cycles = rentalCycles(events);

  if (!cycles.length) {
    return <div className="border border-hairline bg-panel p-5 text-sm text-ink-faint shadow-[var(--shadow-panel)]">No rental history yet.</div>;
  }

  return (
    <div className="border border-hairline bg-panel shadow-[var(--shadow-panel)]">
      <div className="flex items-center gap-2 border-b border-hairline px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-ink-dim">
        <IconTruck className="text-[14px] text-ink-faint" /> Customer History
      </div>
      <ul className="divide-y divide-ink-faint">
        {cycles.map((c) => (
          <li key={c.id} className="px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-[16px] font-semibold text-ink">
                {c.customer_name ?? <span className="text-signal-high">Unknown customer</span>}
              </span>
              {!c.returned && (
                <span className="text-[11px] font-semibold uppercase tracking-wide text-signal-low">Current</span>
              )}
            </div>
            <p className="mt-1 text-[13px] text-ink-dim">
              <span className="text-ink-faint">Shipped to — </span>
              {c.site_name ? (
                <>{c.site_name}{c.site_address ? `, ${c.site_address}` : ""}</>
              ) : (
                <span className="text-signal-high">Unassigned</span>
              )}
            </p>
            <p className="mt-0.5 font-mono text-[12px] text-ink-faint">
              {formatDate(c.checked_out)} → {c.returned ? formatDate(c.returned) : "Present"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
