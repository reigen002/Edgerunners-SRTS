// Pure, explainable computation over the seed data — the "AI" is rule/statistics code, not a black box.
import {
  DEMO_NOW, OFFICIAL_ASSETS, SITES, OPERATORS, CUSTOMERS, ASSET_STATE,
  ANOMALY_THRESHOLDS as T, DEMAND_HISTORY, TELEMETRY_SCENARIOS,
} from "./seed";

const dayMs = 86400000;
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / dayMs);

const siteById = Object.fromEntries(SITES.map((s) => [s.site_id, s]));
const operatorById = Object.fromEntries(OPERATORS.map((o) => [o.operator_id, o]));
const customerById = Object.fromEntries(CUSTOMERS.map((c) => [c.customer_id, c]));

export function utilization(asset) {
  const { engine_hours_per_day: e, idle_hours_per_day: i, operating_days: d } = asset;
  const total = e + i;
  const utilization_pct = total === 0 ? 0 : Math.round((e / total) * 100);
  return { utilization_pct, productive_hours_total: e * d, idle_hours_total: i * d };
}

function status(asset, state) {
  if (!state.site_id) return "UNASSIGNED";
  if (state.current_state === "RETURNED") return "RETURNED";
  const overdue = daysBetween(asset.checkin_date, DEMO_NOW) > 0;
  if (overdue) return "OVERDUE";
  const daysToReturn = daysBetween(DEMO_NOW, asset.checkin_date);
  if (daysToReturn >= 0 && daysToReturn <= T.return_approaching_days) return "APPROACHING_RETURN";
  return "RENTED";
}

function currentTelemetry(equipmentId) {
  const frames = telemetryFrames(equipmentId);
  return frames.length ? frames[frames.length - 1] : null;
}

export function telemetryFrames(equipmentId) {
  const scenario = TELEMETRY_SCENARIOS[equipmentId];
  if (!scenario) return [];
  const {
    waypoints, frame_count, interval_minutes, base_temp_c, temp_ramp_at_frame,
    temp_ramp_c_per_frame, seatbelt_off_frames, base_fuel_pct, fuel_rate_lph, fault_at_frame,
  } = scenario;

  const start = new Date(DEMO_NOW);
  const frames = [];
  for (let f = 0; f < frame_count; f++) {
    const t = f / (frame_count - 1);
    const segCount = waypoints.length - 1;
    const segF = t * segCount;
    const segI = Math.min(Math.floor(segF), segCount - 1);
    const segT = segF - segI;
    const [lat1, lon1] = waypoints[segI];
    const [lat2, lon2] = waypoints[segI + 1];
    const lat = lat1 + (lat2 - lat1) * segT;
    const lon = lon1 + (lon2 - lon1) * segT;

    const temp = f >= temp_ramp_at_frame
      ? base_temp_c + (f - temp_ramp_at_frame + 1) * temp_ramp_c_per_frame
      : base_temp_c;

    const ts = new Date(start.getTime() + f * interval_minutes * 60000).toISOString().slice(0, 19);

    frames.push({
      asset_id: equipmentId,
      timestamp: ts,
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4)),
      engine_on: true,
      engine_hours: Number((f * (interval_minutes / 60)).toFixed(2)),
      idle_minutes: 0,
      fuel_pct: Math.max(5, Math.round(base_fuel_pct - f * 0.6)),
      fuel_rate_lph: fuel_rate_lph,
      engine_temp_c: Math.round(temp),
      seatbelt: seatbelt_off_frames.includes(f) ? "OFF" : "ON",
      fault_code: fault_at_frame && f >= fault_at_frame.frame ? fault_at_frame.code : null,
    });
  }
  return frames;
}

export function detect(equipmentId) {
  const asset = OFFICIAL_ASSETS.find((a) => a.equipment_id === equipmentId);
  const state = ASSET_STATE[equipmentId];
  const { utilization_pct } = utilization(asset);
  const anomalies = [];

  if (!state.site_id) {
    anomalies.push({
      code: "missing_site", severity: "HIGH", condition: "No site assignment on record",
      evidence: `${equipmentId} has no recorded site assignment.`,
      values: {}, recommended_action: "Review asset assignment; update rental records.",
    });
  }
  if (!state.operator_id) {
    anomalies.push({
      code: "missing_operator", severity: "HIGH", condition: "No operator assignment on record",
      evidence: `${equipmentId} has no recorded operator assignment.`,
      values: {}, recommended_action: "Assign and record an operator.",
    });
  }
  if (asset.engine_hours_per_day === 0) {
    anomalies.push({
      code: "zero_productive", severity: "HIGH", condition: "Zero productive engine hours per day",
      evidence: `${equipmentId} recorded 0 engine hours/day across ${asset.operating_days} operating days.`,
      values: { engine_hours_per_day: asset.engine_hours_per_day, operating_days: asset.operating_days },
      recommended_action: "Verify the asset is needed; consider recall.",
    });
  }
  if (utilization_pct < T.low_utilization_pct) {
    anomalies.push({
      code: "low_utilization",
      severity: utilization_pct < T.low_utilization_severe_pct ? "HIGH" : "MEDIUM",
      condition: `Productive utilization below ${T.low_utilization_pct}%`,
      evidence: `${equipmentId} recorded ${asset.engine_hours_per_day} engine hours/day and ${asset.idle_hours_per_day} idle hours/day across ${asset.operating_days} operating days (${utilization_pct}% utilization).`,
      values: { utilization_pct, engine_hours_per_day: asset.engine_hours_per_day, idle_hours_per_day: asset.idle_hours_per_day, operating_days: asset.operating_days },
      recommended_action: "Review customer requirement; consider early return or reallocation.",
    });
  }
  if (asset.idle_hours_per_day >= T.excessive_idle_hours) {
    anomalies.push({
      code: "excessive_idle",
      severity: asset.idle_hours_per_day >= T.excessive_idle_severe_hours ? "HIGH" : "MEDIUM",
      condition: `Idle hours per day at or above ${T.excessive_idle_hours}`,
      evidence: `${equipmentId} recorded ${asset.idle_hours_per_day} idle hours/day across ${asset.operating_days} operating days.`,
      values: { idle_hours_per_day: asset.idle_hours_per_day, operating_days: asset.operating_days },
      recommended_action: "Investigate why the machine sits idle.",
    });
  }
  const overdueDays = daysBetween(asset.checkin_date, DEMO_NOW);
  if (overdueDays > 0 && state.current_state !== "RETURNED") {
    anomalies.push({
      code: "overdue_return", severity: "HIGH", condition: "Past expected check-in date",
      evidence: `${equipmentId} was due back ${asset.checkin_date} — ${overdueDays} days overdue.`,
      values: { checkin_date: asset.checkin_date, days_overdue: overdueDays },
      recommended_action: "Recover the asset; update records.",
    });
  } else {
    const daysToReturn = daysBetween(DEMO_NOW, asset.checkin_date);
    if (daysToReturn >= 0 && daysToReturn <= T.return_approaching_days && state.current_state !== "RETURNED") {
      anomalies.push({
        code: "return_approaching", severity: "MEDIUM", condition: "Return date approaching",
        evidence: `${equipmentId} is due back ${asset.checkin_date} — ${daysToReturn} day(s) away.`,
        values: { checkin_date: asset.checkin_date, days_to_return: daysToReturn },
        recommended_action: "Prepare for return/renewal.",
      });
    }
  }

  const frame = currentTelemetry(equipmentId);
  if (frame) {
    if (frame.engine_temp_c > T.engine_overheat_c) {
      anomalies.push({
        code: "engine_overheat", severity: "HIGH", condition: `Engine temperature above ${T.engine_overheat_c}°C`,
        evidence: `${equipmentId} telemetry recorded engine temperature at ${frame.engine_temp_c}°C.`,
        values: { engine_temp_c: frame.engine_temp_c }, recommended_action: "Inspect cooling system before continued operation.",
      });
    }
    if (frame.seatbelt === "OFF" && frame.engine_on) {
      anomalies.push({
        code: "unsafe_seatbelt", severity: "HIGH", condition: "Seatbelt off while engine running",
        evidence: `${equipmentId} telemetry recorded seatbelt OFF while the engine was running.`,
        values: { seatbelt: frame.seatbelt }, recommended_action: "Notify operator; deliver safety coaching.",
      });
    }
    if (frame.fuel_rate_lph > T.abnormal_fuel_lph) {
      anomalies.push({
        code: "abnormal_fuel", severity: "MEDIUM", condition: `Fuel rate above ${T.abnormal_fuel_lph} L/h`,
        evidence: `${equipmentId} telemetry recorded a fuel rate of ${frame.fuel_rate_lph} L/h.`,
        values: { fuel_rate_lph: frame.fuel_rate_lph }, recommended_action: "Check for leak/inefficiency; inspect.",
      });
    }
  }

  const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  return anomalies;
}

export function events(equipmentId) {
  const asset = OFFICIAL_ASSETS.find((a) => a.equipment_id === equipmentId);
  const state = ASSET_STATE[equipmentId];
  const ev = [];
  let n = 1;
  const id = () => `EV-${equipmentId}-${String(n++).padStart(2, "0")}`;

  ev.push({
    id: id(), asset_id: equipmentId, timestamp: `${asset.checkout_date}T08:00:00`, type: "CHECKOUT",
    title: "Checked out from dealership",
    detail: state.site_id ? `Assigned to ${siteById[state.site_id]?.name ?? state.site_id}.` : "No site or operator assigned at checkout.",
    actor: "Dealer Desk",
  });
  if (state.site_id) {
    ev.push({ id: id(), asset_id: equipmentId, timestamp: `${asset.checkout_date}T08:05:00`, type: "SITE_ASSIGNED", title: `Assigned to ${siteById[state.site_id]?.name ?? state.site_id}`, detail: "", actor: "Dealer Desk" });
  }
  if (state.operator_id) {
    ev.push({ id: id(), asset_id: equipmentId, timestamp: `${asset.checkout_date}T08:10:00`, type: "OPERATOR_ASSIGNED", title: `Operator ${operatorById[state.operator_id]?.name ?? state.operator_id} assigned`, detail: "", actor: "Dealer Desk" });
  }

  const overdueDays = daysBetween(asset.checkin_date, DEMO_NOW);
  if (state.current_state === "RETURNED") {
    ev.push({ id: id(), asset_id: equipmentId, timestamp: `${asset.checkin_date}T16:00:00`, type: "CHECKIN", title: "Returned to dealership", detail: "", actor: "Dealer Desk" });
  } else if (overdueDays > 0) {
    ev.push({ id: id(), asset_id: equipmentId, timestamp: `${asset.checkin_date}T00:00:00`, type: "OVERDUE_FLAG", title: "Flagged overdue", detail: `${overdueDays} days past expected check-in.`, actor: "System" });
  }

  const frames = telemetryFrames(equipmentId);
  const overheatFrame = frames.find((f) => f.engine_temp_c > T.engine_overheat_c);
  if (overheatFrame) {
    ev.push({ id: id(), asset_id: equipmentId, timestamp: overheatFrame.timestamp, type: "TELEMETRY_ALERT", title: "Engine overheat detected", detail: `${overheatFrame.engine_temp_c}°C recorded.`, actor: "System" });
  }
  const seatbeltFrame = frames.find((f) => f.seatbelt === "OFF");
  if (seatbeltFrame) {
    ev.push({ id: id(), asset_id: equipmentId, timestamp: seatbeltFrame.timestamp, type: "SAFETY_EVENT", title: "Seatbelt off while operating", detail: "", actor: "System" });
  }

  return ev.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export function assetSummary(equipmentId) {
  const asset = OFFICIAL_ASSETS.find((a) => a.equipment_id === equipmentId);
  const state = ASSET_STATE[equipmentId];
  const { utilization_pct } = utilization(asset);
  const anomalies = detect(equipmentId);
  const site = state.site_id ? siteById[state.site_id] : null;
  const frame = currentTelemetry(equipmentId);
  const location = frame ? { lat: frame.lat, lon: frame.lon } : site ? { lat: site.lat, lon: site.lon } : null;

  return {
    equipment_id: equipmentId,
    type: asset.type,
    status: status(asset, state),
    site_id: state.site_id,
    site_name: site?.name ?? null,
    operator_id: state.operator_id,
    operator_name: state.operator_id ? operatorById[state.operator_id]?.name ?? null : null,
    customer: state.customer_id ? customerById[state.customer_id]?.name ?? null : null,
    location,
    utilization_pct,
    engine_hours_per_day: asset.engine_hours_per_day,
    idle_hours_per_day: asset.idle_hours_per_day,
    operating_days: asset.operating_days,
    checkout_date: asset.checkout_date,
    checkin_date: asset.checkin_date,
    anomaly_count: anomalies.length,
    highest_severity: anomalies[0]?.severity ?? null,
    top_anomaly: anomalies[0]
      ? { code: anomalies[0].code, severity: anomalies[0].severity, summary: anomalies[0].evidence }
      : null,
    source: "official",
  };
}

export function assetDetail(equipmentId) {
  const state = ASSET_STATE[equipmentId];
  return {
    ...assetSummary(equipmentId),
    anomalies: detect(equipmentId),
    recommendations: recommendationsForAsset(equipmentId),
    events: events(equipmentId),
    telemetry_current: currentTelemetry(equipmentId),
    assignment: {
      site_id: state.site_id, operator_id: state.operator_id,
      customer: state.customer_id ? customerById[state.customer_id]?.name ?? null : null,
      expected_checkin: state.expected_checkin,
    },
  };
}

export function allAssetIds() {
  return OFFICIAL_ASSETS.map((a) => a.equipment_id);
}

// Lifecycle mutations — the only runtime-mutated state, per IMPLEMENTATION_PLAN §16.
// In-memory only (no backend yet); resets on page reload. Swap for real POSTs when the API lands.
export function checkout(equipmentId, { site_id, operator_id, customer, expected_checkin }) {
  ASSET_STATE[equipmentId] = {
    current_state: "RENTED", site_id, operator_id,
    customer_id: CUSTOMERS.find((c) => c.name === customer)?.customer_id ?? null,
    expected_checkin,
  };
  return assetDetail(equipmentId);
}

export function checkin(equipmentId) {
  const state = ASSET_STATE[equipmentId];
  ASSET_STATE[equipmentId] = { ...state, current_state: "RETURNED" };
  return assetDetail(equipmentId);
}

export function allAlerts({ severity, asset_id } = {}) {
  let alerts = allAssetIds().flatMap((id) =>
    detect(id).map((a) => ({
      id: `AL-${id}-${a.code}`,
      asset_id: id,
      code: a.code,
      severity: a.severity,
      message: a.evidence,
      recommended_action: a.recommended_action,
      created_at: DEMO_NOW,
    }))
  );
  if (severity) alerts = alerts.filter((a) => a.severity === severity);
  if (asset_id) alerts = alerts.filter((a) => a.asset_id === asset_id);
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity] || a.asset_id.localeCompare(b.asset_id));
}

export function sitesWithCounts() {
  const counts = {};
  for (const id of allAssetIds()) {
    const s = ASSET_STATE[id].site_id;
    if (s) counts[s] = (counts[s] ?? 0) + 1;
  }
  return SITES.map((s) => ({ ...s, asset_count: counts[s.site_id] ?? 0 }));
}

export function operatorsList() {
  return OPERATORS;
}

function movingAverageForecast(history) {
  const sorted = [...history].sort((a, b) => a.period.localeCompare(b.period));
  const counts = sorted.map((h) => h.count);
  const weighted = (arr) => {
    const w = [1, 2, 3].slice(-arr.length);
    const sum = arr.reduce((acc, v, i) => acc + v * w[i], 0);
    const wsum = w.reduce((a, b) => a + b, 0);
    return Math.round(sum / wsum);
  };
  const lastThree = counts.slice(-3);
  const nextCount = weighted(lastThree);
  const lastPeriod = sorted[sorted.length - 1].period;
  const [y, m] = lastPeriod.split("-").map(Number);
  const nextPeriod = (yy, mm) => {
    const d = new Date(Date.UTC(yy, mm - 1 + 1, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  const p1 = nextPeriod(y, m);
  const [y1, m1] = p1.split("-").map(Number);
  const p2 = nextPeriod(y1, m1);
  return { history: sorted, forecast: [{ period: p1, count: nextCount }, { period: p2, count: nextCount }] };
}

export function forecastFor(siteId, equipmentType) {
  const history = DEMAND_HISTORY.filter((d) => d.site_id === siteId && d.equipment_type === equipmentType);
  if (!history.length) return null;
  const { history: hist, forecast } = movingAverageForecast(history);
  const rising = forecast[0].count >= hist[hist.length - 1].count;
  const fillable = allAssetIds()
    .filter((id) => {
      const asset = OFFICIAL_ASSETS.find((a) => a.equipment_id === id);
      const state = ASSET_STATE[id];
      const overdue = daysBetween(asset.checkin_date, DEMO_NOW) > 0 && state.current_state !== "RETURNED";
      return asset.type === equipmentType && (!state.site_id || overdue);
    })
    .map((id) => ({ equipment_id: id, reason: `${equipmentType}, expected available (overdue/recoverable).` }));

  return {
    site_id: siteId,
    equipment_type: equipmentType,
    history: hist,
    forecast,
    method: "3-month weighted moving average (weights 1-2-3), rounded",
    expected_requirement: `~${forecast[0].count} ${equipmentType.toLowerCase()}${forecast[0].count === 1 ? "" : "s"}/month at ${siteId}${rising ? ", rising trend" : ""}.`,
    fillable_by: fillable,
  };
}

export function allForecasts() {
  const pairs = [...new Set(DEMAND_HISTORY.map((d) => `${d.site_id}::${d.equipment_type}`))];
  return pairs.map((p) => {
    const [site_id, equipment_type] = p.split("::");
    return forecastFor(site_id, equipment_type);
  });
}

let recIdSeq = 1;
export function recommendationsForAsset(equipmentId) {
  const anomalies = detect(equipmentId);
  const recs = [];
  const has = (code) => anomalies.find((a) => a.code === code);

  if (has("zero_productive") || has("overdue_return") || (has("low_utilization")?.severity === "HIGH")) {
    const anomaly = has("overdue_return") ?? has("zero_productive") ?? has("low_utilization");
    recs.push({
      id: `REC-${equipmentId}-RET`, type: "return", asset_id: equipmentId, target_site_id: null,
      severity: "HIGH", title: `Recover ${equipmentId}`,
      rationale: anomaly.evidence, action: anomaly.recommended_action,
    });
  }
  if (has("missing_site") || has("missing_operator")) {
    recs.push({
      id: `REC-${equipmentId}-ASN`, type: "assignment", asset_id: equipmentId, target_site_id: null,
      severity: "HIGH", title: `Update assignment for ${equipmentId}`,
      rationale: "No site and/or operator on record for a checked-out asset.",
      action: "Review asset assignment and update rental records.",
    });
  }
  if (has("engine_overheat") || has("abnormal_fuel")) {
    const anomaly = has("engine_overheat") ?? has("abnormal_fuel");
    recs.push({
      id: `REC-${equipmentId}-MNT`, type: "maintenance", asset_id: equipmentId, target_site_id: null,
      severity: "HIGH", title: `Inspect ${equipmentId}`,
      rationale: anomaly.evidence, action: anomaly.recommended_action,
    });
  }
  return recs;
}

export function allRecommendations() {
  const fleetRecs = allAssetIds().flatMap(recommendationsForAsset);

  // Allocation: forecast gap + a fillable asset -> recommend recovering it to the demanding site.
  for (const forecast of allForecasts()) {
    if (!forecast || !forecast.fillable_by.length) continue;
    const candidate = forecast.fillable_by[0];
    fleetRecs.push({
      id: `REC-ALLOC-${candidate.equipment_id}-${forecast.site_id}`,
      type: "allocation", asset_id: candidate.equipment_id, target_site_id: forecast.site_id,
      severity: "HIGH", title: `Reallocate ${candidate.equipment_id} to ${forecast.site_id}`,
      rationale: `${forecast.site_id} is forecast to need ${forecast.expected_requirement} ${candidate.reason}`,
      action: `Recover ${candidate.equipment_id} and allocate it to ${forecast.site_id}.`,
    });
  }

  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return fleetRecs.sort((a, b) => order[a.severity] - order[b.severity]);
}
