import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { StatusPill } from "../components/StatusPill";
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

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-4 sm:p-6">
      <Link to="/" className="inline-flex items-center gap-1 text-[13px] text-ink-faint hover:text-ink-dim">
        ← Fleet Dashboard
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 border border-hairline bg-panel px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl text-ink">{asset.equipment_id}</h1>
            <StatusPill status={asset.status} />
          </div>
          <p className="mt-0.5 text-sm text-ink-dim">{asset.type} · {asset.anomaly_count} open anomal{asset.anomaly_count === 1 ? "y" : "ies"}</p>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="border border-hairline bg-panel p-3 lg:col-span-1">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Assignment</div>
          <dl className="space-y-1.5 text-[13px]">
            <div className="flex justify-between"><dt className="text-ink-faint">Site</dt><dd className="text-ink-dim">{asset.assignment.site_id ? asset.site_name : "Unassigned"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Operator</dt><dd className="text-ink-dim">{asset.assignment.operator_id ? asset.operator_name : "Unassigned"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Customer</dt><dd className="text-ink-dim">{asset.assignment.customer ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Checkout</dt><dd className="text-ink-dim font-mono">{formatDate(asset.checkout_date)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-faint">Expected Check-In</dt><dd className="text-ink-dim font-mono">{formatDate(asset.assignment.expected_checkin)}</dd></div>
          </dl>
        </div>
        <UtilizationChart engineHoursPerDay={asset.engine_hours_per_day} idleHoursPerDay={asset.idle_hours_per_day} />
        <FleetMap sites={[]} assets={[mapAsset]} trace={trace} />
      </div>

      <div>
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Anomalies</div>
        {asset.anomalies.length === 0 ? (
          <div className="border border-hairline bg-panel p-4 text-sm text-ink-faint">No active anomalies.</div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {asset.anomalies.map((a) => <AnomalyCard key={a.code} anomaly={a} />)}
          </div>
        )}
      </div>

      <TelemetryPanel frames={telemetry} onFrame={onFrame} />

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
