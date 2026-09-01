import { useEffect, useState } from "react";
import { api } from "../api/client";
import { KpiCluster } from "../components/KpiTile";
import { HeroAssetPanel } from "../components/HeroAssetPanel";
import { FleetTable } from "../components/FleetTable";
import { AlertsFeed } from "../components/AlertsFeed";
import { FleetMap } from "../components/FleetMap";
import { ForecastPanel } from "../components/ForecastPanel";
import { RecommendationPanel } from "../components/RecommendationPanel";

const severityRank = { CRITICAL: -1, HIGH: 0, MEDIUM: 1, LOW: 2 };

export function Dashboard() {
  const [assets, setAssets] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [sites, setSites] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // getAssets() populates the site/operator reference cache the mutation
    // forms and getSites() depend on — must resolve before those fire.
    api.getAssets().then((r) => {
      setAssets(r.assets);
      api.getSites().then((res) => setSites(res.sites));
    }).catch((e) => setError(e.message || "Failed to load fleet."));
    api.getAlerts().then((r) => setAlerts(r.alerts));
    api.getForecast().then((r) => setForecasts(r.forecasts));
    api.getRecommendations().then((r) => setRecommendations(r.recommendations));
  }, []);

  if (error) return <div className="p-6 text-sm text-signal-high">Couldn't reach the backend — {error} Is the API running at the configured base URL?</div>;
  if (!assets) return <div className="p-6 text-sm text-ink-faint">Loading fleet…</div>;

  const needsAttention = assets.filter((a) => a.anomaly_count > 0).length;
  const highAlerts = alerts.filter((a) => a.severity === "HIGH" || a.severity === "CRITICAL").length;
  const avgUtilization = Math.round(assets.reduce((s, a) => s + a.utilization_pct, 0) / assets.length);
  const risingForecast = forecasts.find((f) => f && f.forecast[0].demand >= f.history[f.history.length - 1]?.demand) ?? forecasts[0];

  const heroAsset = [...assets]
    .filter((a) => a.highest_severity)
    .sort((a, b) => (severityRank[a.highest_severity] - severityRank[b.highest_severity]) || (b.anomaly_count - a.anomaly_count))[0];
  const heroRecommendation = heroAsset
    ? recommendations.find((r) => r.asset_id === heroAsset.equipment_id)
    : null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-4 sm:p-6">
      <KpiCluster
        items={[
          { label: "Fleet Size", value: assets.length },
          { label: "Needs Attention", value: needsAttention, tone: needsAttention > 0 ? "high" : "default" },
          { label: "High Alerts", value: highAlerts, tone: highAlerts > 0 ? "high" : "default" },
          { label: "Avg. Utilization", value: `${avgUtilization}%` },
        ]}
      />

      <HeroAssetPanel asset={heroAsset} recommendation={heroRecommendation} />

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
