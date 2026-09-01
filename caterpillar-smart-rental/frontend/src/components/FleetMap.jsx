import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline } from "react-leaflet";
import { useNavigate } from "react-router-dom";

const SITE_CENTER = [34.06, -117.43];

function severityColor(sev) {
  if (sev === "HIGH" || sev === "CRITICAL") return "#ffc72c";
  if (sev === "MEDIUM") return "#ff9f43";
  return "#5b9bd5";
}

export function FleetMap({ sites, assets, trace }) {
  const navigate = useNavigate();
  return (
    <div className="border border-hairline bg-panel shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between border-b border-hairline px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        <span>Site &amp; Fleet Map</span>
        <span className="flex items-center gap-2.5 normal-case tracking-normal text-ink-faint">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-signal-high" />High</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-signal-medium" />Med</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-signal-low" />Info</span>
        </span>
      </div>
      <MapContainer center={SITE_CENTER} zoom={11} scrollWheelZoom={false} className="h-72 w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sites.map((s) => {
          // Count from the live asset list rather than trusting a
          // pre-computed field — the real backend has no /sites endpoint
          // to source one from, so this stays correct in both modes.
          const count = assets.filter((a) => a.site_id === s.site_id).length;
          return (
            <CircleMarker
              key={s.site_id}
              center={[s.lat, s.lon]}
              radius={count > 0 ? 7 : 5}
              pathOptions={{ color: "#9aa0ac", weight: 1.5, fillColor: "#232732", fillOpacity: 1 }}
            >
              <Tooltip direction="top">{s.name} · {count} asset{count === 1 ? "" : "s"}</Tooltip>
            </CircleMarker>
          );
        })}
        {assets.filter((a) => a.location).map((a) => (
          <CircleMarker
            key={a.equipment_id}
            center={[a.location.lat, a.location.lon]}
            radius={6}
            pathOptions={{ color: severityColor(a.highest_severity), weight: 2, fillColor: severityColor(a.highest_severity), fillOpacity: 0.85 }}
            eventHandlers={{ click: () => navigate(`/asset/${a.equipment_id}`) }}
          >
            <Tooltip direction="top">{a.equipment_id} · {a.status}</Tooltip>
          </CircleMarker>
        ))}
        {trace && trace.length > 1 && (
          <Polyline positions={trace} pathOptions={{ color: "#ffc72c", weight: 2, opacity: 0.8 }} />
        )}
      </MapContainer>
    </div>
  );
}
