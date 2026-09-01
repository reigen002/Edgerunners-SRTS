import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline } from "react-leaflet";
import { useNavigate } from "react-router-dom";

const SITE_CENTER = [34.06, -117.43];

function severityColor(sev) {
  if (sev === "HIGH") return "#ffc72c";
  if (sev === "MEDIUM") return "#ff9f43";
  return "#5b9bd5";
}

export function FleetMap({ sites, assets, trace }) {
  const navigate = useNavigate();
  return (
    <div className="border border-hairline bg-panel">
      <div className="border-b border-hairline px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        Site &amp; Fleet Map
      </div>
      <MapContainer center={SITE_CENTER} zoom={11} scrollWheelZoom={false} className="h-72 w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {sites.map((s) => (
          <CircleMarker
            key={s.site_id}
            center={[s.lat, s.lon]}
            radius={s.asset_count > 0 ? 7 : 5}
            pathOptions={{ color: "#9aa0ac", weight: 1.5, fillColor: "#232732", fillOpacity: 1 }}
          >
            <Tooltip direction="top">{s.name} · {s.asset_count} asset{s.asset_count === 1 ? "" : "s"}</Tooltip>
          </CircleMarker>
        ))}
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
