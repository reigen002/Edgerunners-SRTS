import { useEffect, useState } from "react";
import { api } from "../api/client";
import { KpiTile } from "../components/KpiTile";
import { FleetTable } from "../components/FleetTable";
import { AlertsFeed } from "../components/AlertsFeed";
import { FleetMap } from "../components/FleetMap";
import { ForecastPanel } from "../components/ForecastPanel";
import { RecommendationPanel } from "../components/RecommendationPanel";

export function Dashboard() {
  const [assets, setAssets] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [sites, setSites] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    api.getAssets().then((r) => setAssets(r.assets));
    api.getAlerts().then((r) => setAlerts(r.alerts));
    api.getSites().then((r) => setSites(r.sites));
    api.getForecast().then((r) => setForecasts(r.forecasts));
    api.getRecommendations().then((r) => setRecommendations(r.recommendations));
  }, []);

  if (!assets) return <div className="p-6 text-sm text-ink-faint">Loading fleet…</div>;

  const needsAttention = assets.filter((a) => a.anomaly_count > 0).length;
  const highAlerts = alerts.filter((a) => a.severity === "HIGH").length;
  const avgUtilization = Math.round(assets.reduce((s, a) => s + a.utilization_pct, 0) / assets.length);
  const risingForecast = forecasts.find((f) => f && f.forecast[0].count >= f.history[f.history.length - 1].count) ?? forecasts[0];

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile label="Fleet Size" value={assets.length} />
        <KpiTile label="Needs Attention" value={needsAttention} tone={needsAttention > 0 ? "high" : "default"} />
        <KpiTile label="High Alerts" value={highAlerts} tone={highAlerts > 0 ? "high" : "default"} />
        <KpiTile label="Avg. Utilization" value={`${avgUtilization}%`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <FleetTable assets={assets} />
        <div className="space-y-4">
          <AlertsFeed alerts={alerts} />
          <FleetMap sites={sites} assets={assets} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ForecastPanel forecast={risingForecast} />
        <RecommendationPanel recommendations={recommendations} showAsset />
      </div>
    </div>
  );
}
