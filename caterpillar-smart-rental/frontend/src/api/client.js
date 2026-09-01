// Mock-first API client — shapes match docs/API_CONTRACT.md exactly.
// Swap USE_MOCK to false and point BASE at the real backend when it lands; no caller changes needed.
import * as engine from "../mock/engine";
import { DEMO_NOW } from "../mock/seed";

const USE_MOCK = true;
const BASE = "http://localhost:8000/api";

const ok = (data) => Promise.resolve(data);

async function realFetch(path, opts) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? "Request failed");
  return body;
}

export const api = {
  async getAssets() {
    if (USE_MOCK) return ok({ assets: engine.allAssetIds().map(engine.assetSummary) });
    return realFetch("/assets");
  },
  async getAsset(id) {
    if (USE_MOCK) return ok(engine.assetDetail(id));
    return realFetch(`/assets/${id}`);
  },
  async getTelemetry(id) {
    if (USE_MOCK) return ok({ asset_id: id, frames: engine.telemetryFrames(id) });
    return realFetch(`/assets/${id}/telemetry`);
  },
  async getEvents(id) {
    if (USE_MOCK) return ok({ asset_id: id, events: engine.events(id) });
    return realFetch(`/assets/${id}/events`);
  },
  async getAlerts(params = {}) {
    if (USE_MOCK) return ok({ alerts: engine.allAlerts(params) });
    const qs = new URLSearchParams(params).toString();
    return realFetch(`/alerts${qs ? `?${qs}` : ""}`);
  },
  async getSites() {
    if (USE_MOCK) return ok({ sites: engine.sitesWithCounts() });
    return realFetch("/sites");
  },
  async getOperators() {
    if (USE_MOCK) return ok({ operators: engine.operatorsList() });
    return realFetch("/operators");
  },
  async checkout(id, body) {
    if (USE_MOCK) return ok(engine.checkout(id, body));
    return realFetch(`/assets/${id}/checkout`, { method: "POST", body: JSON.stringify(body) });
  },
  async checkin(id, body) {
    if (USE_MOCK) return ok(engine.checkin(id, body));
    return realFetch(`/assets/${id}/checkin`, { method: "POST", body: JSON.stringify(body) });
  },
  async getForecast(params = {}) {
    if (USE_MOCK) {
      if (params.site_id && params.type) return ok(engine.forecastFor(params.site_id, params.type));
      return ok({ forecasts: engine.allForecasts() });
    }
    const qs = new URLSearchParams(params).toString();
    return realFetch(`/forecast${qs ? `?${qs}` : ""}`);
  },
  async getRecommendations() {
    if (USE_MOCK) return ok({ recommendations: engine.allRecommendations() });
    return realFetch("/recommendations");
  },
  async getHealth() {
    if (USE_MOCK) return ok({ status: "ok", demo_now: DEMO_NOW, asset_count: engine.allAssetIds().length });
    return realFetch("/health");
  },
};
