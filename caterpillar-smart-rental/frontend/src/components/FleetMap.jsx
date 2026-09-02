import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polyline, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
// Resolved --color-signal-* hex values — Leaflet's SVG renderer needs real
// hex/rgb, it can't read CSS custom properties. Keep in sync with index.css.
const SEVERITY_HEX = {
  CRITICAL: "#ff4438",
  HIGH: "#ffc72c",
  MEDIUM: "#ff9f43",
  LOW: "#5b9bd5",
};
const MAP_LINE = "#ffc72c";

// ponytail: fit to whatever coordinates actually arrive instead of a
// hardcoded center — the mock seed sites live in California, the real API's
// sites live in Manila, and a fixed center/zoom stales the moment either
// dataset changes. Upgrade to a persisted user viewport if that's ever needed.
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(points, { padding: [28, 28], maxZoom: 14 });
    }
  }, [map, points]);
  return null;
}

export function FleetMap({ sites, assets, trace }) {
  const navigate = useNavigate();
  const assetsWithLocation = assets.filter((a) => a.location);
  const points = [
    ...sites.map((s) => [s.lat, s.lon]),
    ...assetsWithLocation.map((a) => [a.location.lat, a.location.lon]),
  ];

  return (
    <div className="border border-hairline bg-panel shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between border-b border-hairline px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        <span>Site &amp; Fleet Map</span>
        <span className="flex items-center gap-2.5 normal-case tracking-normal text-ink-faint">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-signal-critical" />Critical</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-signal-high" />High</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-signal-medium" />Medium</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-signal-low" />Low</span>
        </span>
      </div>
      {points.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-sm text-ink-faint">Awaiting position data.</div>
      ) : (
        <MapContainer center={points[0]} zoom={11} scrollWheelZoom={false} className="h-80 w-full bg-ground">
          {/* Esri's dark gray canvas: free, keyless, no rate-limit wall — CARTO's
              basemaps.cartocdn.com dark_all now serves an "API key required"
              watermark on anonymous requests. Base + reference (labels) as two
              layers, standard for this basemap. */}
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}" />
          <FitBounds points={points} />
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
          {assetsWithLocation.map((a) => {
            const hex = SEVERITY_HEX[a.highest_severity] ?? "#9aa0ac";
            return (
              <CircleMarker
                key={a.equipment_id}
                center={[a.location.lat, a.location.lon]}
                radius={6}
                pathOptions={{ color: "#14161a", weight: 2, fillColor: hex, fillOpacity: 0.95 }}
                eventHandlers={{ click: () => navigate(`/asset/${a.equipment_id}`) }}
              >
                <Tooltip direction="top">{a.equipment_id} · {a.status}</Tooltip>
              </CircleMarker>
            );
          })}
          {trace && trace.length > 1 && (
            <Polyline positions={trace} pathOptions={{ color: MAP_LINE, weight: 2, opacity: 0.8 }} />
          )}
        </MapContainer>
      )}
    </div>
  );
}
