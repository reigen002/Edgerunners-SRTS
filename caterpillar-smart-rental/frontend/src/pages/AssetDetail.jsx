import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { StatusPill, SeverityPill } from "../components/StatusPill";
import { UtilizationChart } from "../components/UtilizationChart";
import { AnomalyCard } from "../components/AnomalyCard";
import { TelemetryPanel } from "../components/TelemetryPanel";
import { LifecycleTimeline } from "../components/LifecycleTimeline";
import { RecommendationPanel } from "../components/RecommendationPanel";
import { SafetyCoaching } from "../components/SafetyCoaching";
import { FleetMap } from "../components/FleetMap";
import { CheckInOutModal } from "../components/CheckInOutModal";
import { formatDate } from "../lib/format";
import { IconArrowRight } from "../components/icons";

function Stat({ label, value, tone = "text-ink" }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={`mt-0.5 font-mono text-[15px] font-medium tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

export function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [modal, setModal] = useState(null);

  const load = useCallback(() => {
    api.getAsset(id).then(setAsset);
    api.getTelemetry(id).then((r) => setTelemetry(r.frames));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const onFrame = useCallback((f) => setCurrentFrame(f), []);

  if (!asset) return <div className="p-6 text-sm text-ink-faint">Loading asset…</div>;

  const seatbeltAnomaly = asset.anomalies.find((a) => a.code === "unsafe_seatbelt");
  const overheatAnomaly = asset.anomalies.find((a) => a.code === "engine_overheat");
  const lowUtilAnomaly = asset.anomalies.find((a) => a.code === "low_utilization");
  const overdueAnomaly = asset.anomalies.find((a) => a.code === "overdue_return");

  async function handleCheckout(body) {
    await api.checkout(id, body);
    setModal(null);
    load();
  }
  async function handleCheckin(body) {
    await api.checkin(id, body);
    setModal(null);
    load();
  }

  const trace = telemetry.length ? telemetry.map((f) => [f.lat, f.lon]) : null;
  const mapAsset = { ...asset, location: currentFrame ? { lat: currentFrame.lat, lon: currentFrame.lon } : asset.location };
  const utilTone = asset.utilization_pct < 30 ? "text-signal-high" : asset.utilization_pct >= 90 ? "text-signal-healthy" : "text-ink";

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-4 sm:p-6">
      <Link to="/" className="inline-flex items-center gap-1 text-[13px] text-ink-faint hover:text-ink-dim">
        ← Fleet Dashboard
      </Link>

      {/* Identity + status + priority + rental state + usage + assignment — one instrument cluster, above the fold. */}
      <div
        className={`relative overflow-hidden border bg-panel shadow-[var(--shadow-hero)] ${
          asset.highest_severity === "HIGH" ? "border-signal-high/35" : "border-hairline"
        }`}
      >
        {asset.highest_severity && <span className={`absolute inset-y-0 left-0 w-1.5 ${asset.highest_severity === "HIGH" ? "bg-signal-high" : "bg-signal-medium"}`} />}
        <div className="flex flex-wrap items-start justify-between gap-4 p-4 pl-6 sm:p-5 sm:pl-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-3xl font-bold leading-none text-ink">{asset.equipment_id}</h1>
              <StatusPill status={asset.status} size="lg" />
              {asset.highest_severity && <SeverityPill severity={asset.highest_severity} size="lg" />}
            </div>
            <p className="mt-1.5 text-sm text-ink-dim">
              {asset.type} · {asset.anomaly_count} open anomal{asset.anomaly_count === 1 ? "y" : "ies"}
              {overdueAnomaly && <span className="text-signal-high"> · {overdueAnomaly.values.days_overdue} days overdue</span>}
            </p>
          </div>
          <div className="flex gap-2">
            {asset.status === "RETURNED" || asset.status === "UNASSIGNED" ? (
              <button onClick={() => setModal("checkout")} className="border border-hairline-strong px-3 py-1.5 text-sm text-ink hover:bg-panel-raised">
                Check Out
              </button>
            ) : (
              <button onClick={() => setModal("checkin")} className="bg-signal-high px-3 py-1.5 text-sm font-medium text-signal-high-ink hover:brightness-95">
                Check In
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-hairline border-t border-hairline sm:grid-cols-4 sm:divide-y-0 lg:grid-cols-8">
          <div className="px-4 py-3"><Stat label="Utilization" value={`${asset.utilization_pct}%`} tone={utilTone} /></div>
          <div className="px-4 py-3"><Stat label="Engine hrs/day" value={asset.engine_hours_per_day} /></div>
          <div className="px-4 py-3"><Stat label="Idle hrs/day" value={asset.idle_hours_per_day} tone={asset.idle_hours_per_day >= 10 ? "text-signal-high" : "text-ink"} /></div>
          <div className="px-4 py-3"><Stat label="Operating days" value={asset.operating_days} /></div>
          <div className="px-4 py-3"><Stat label="Site" value={asset.assignment.site_id ? asset.site_name : "Unassigned"} tone={asset.assignment.site_id ? "text-ink" : "text-signal-high"} /></div>
          <div className="px-4 py-3"><Stat label="Operator" value={asset.assignment.operator_id ? asset.operator_name : "Unassigned"} tone={asset.assignment.operator_id ? "text-ink" : "text-signal-high"} /></div>
          <div className="px-4 py-3"><Stat label="Checkout" value={formatDate(asset.checkout_date)} /></div>
          <div className="px-4 py-3"><Stat label="Expected Check-In" value={formatDate(asset.assignment.expected_checkin)} tone={overdueAnomaly ? "text-signal-high" : "text-ink"} /></div>
        </div>
      </div>

      {/* Usage: utilization detail alongside operational location context. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UtilizationChart engineHoursPerDay={asset.engine_hours_per_day} idleHoursPerDay={asset.idle_hours_per_day} />
        <FleetMap sites={[]} assets={[mapAsset]} trace={trace} />
      </div>

      <TelemetryPanel frames={telemetry} onFrame={onFrame} />

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Anomalies</div>
        {asset.anomalies.length === 0 ? (
          <div className="border border-hairline bg-panel p-4 text-sm text-ink-faint">No active anomalies.</div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {asset.anomalies.map((a) => <AnomalyCard key={a.code} anomaly={a} />)}
          </div>
        )}
      </div>

      {(seatbeltAnomaly || overheatAnomaly || lowUtilAnomaly) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {seatbeltAnomaly && <SafetyCoaching code="unsafe_seatbelt" />}
          {overheatAnomaly && <SafetyCoaching code="engine_overheat" />}
          {!seatbeltAnomaly && !overheatAnomaly && lowUtilAnomaly && <SafetyCoaching code="low_utilization" />}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecommendationPanel recommendations={asset.recommendations} />
        <LifecycleTimeline events={asset.events} />
      </div>

      {asset.recommendations.some((r) => r.type === "allocation" && r.target_site_id) && (
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-[13px] text-signal-high hover:underline"
        >
          View demand forecast on the dashboard <IconArrowRight />
        </button>
      )}

      {modal === "checkout" && (
        <CheckInOutModal mode="checkout" assetId={asset.equipment_id} onClose={() => setModal(null)} onSubmit={handleCheckout} />
      )}
      {modal === "checkin" && (
        <CheckInOutModal mode="checkin" assetId={asset.equipment_id} onClose={() => setModal(null)} onSubmit={handleCheckin} />
      )}
    </div>
  );
}
