# SRTS API Contract

> **Status:** FROZEN at kickoff. This file is the stable boundary between frontend (Yash) and backend (Jimmy). Any change after kickoff must be announced in the team channel and agreed by both. Ms Bean does not edit this file.

**Source of truth for data:** `docs/HACKATHON_SPEC.md` §8 (official assets, read-only).
**Base URL:** `http://localhost:8000` — all endpoints under `/api`.
**CORS:** allow origin `http://localhost:5173` (Vite dev server).
**Content type:** `application/json` everywhere.
**Deterministic clock:** the backend treats the "current date/time" as a fixed constant `DEMO_NOW = 2025-05-12T09:00:00`. All "overdue / approaching return / live" logic is computed against `DEMO_NOW`, never `datetime.now()`. This makes the demo reproducible.

---

## 0. Conventions

- IDs are strings (`"EQX1002"`, `"S003"`, `"OP101"`).
- Dates are ISO `YYYY-MM-DD`; timestamps are ISO `YYYY-MM-DDTHH:MM:SS` (no timezone; treat as local).
- `null` is a **meaningful value** (unassigned site/operator) and must be returned as JSON `null`, never omitted or replaced with `""`.
- Severity enum: `"HIGH" | "MEDIUM" | "LOW"`.
- Asset status enum: `"RENTED" | "RETURNED" | "OVERDUE" | "APPROACHING_RETURN" | "UNASSIGNED"`. (An asset can be `UNASSIGNED` regardless of dates; status precedence defined in IMPLEMENTATION_PLAN §11/§16.)
- Error shape (any non-2xx): `{ "error": { "code": "NOT_FOUND", "message": "..." } }` with an appropriate HTTP status (`404`, `400`, `422`, `500`).

---

## 1. Official dataset schema (`data/seed/official_assets.csv`)

Verbatim transcription of `HACKATHON_SPEC.md` §8. **Do not alter values** (including `Type = "Cater"` for EQX1002). Empty field = `NULL`.

```csv
equipment_id,type,site_id,checkout_date,checkin_date,engine_hours_per_day,idle_hours_per_day,operating_days,last_operator_id
EQX1001,Excavator,S003,2025-04-01,2025-04-16,1.5,10,15,OP101
EQX1002,Cater,,2025-03-01,2025-03-30,0,11,20,
EQX1003,Bulldozer,S002,2025-02-15,2025-03-11,7.5,0.5,25,OP203
EQX1004,Grader,S004,2025-05-05,2025-05-15,2,9,10,OP106
EQX1005,Bulldozer,S006,2025-01-01,2025-01-31,8,0,30,OP301
EQX1006,Grader,S001,2025-04-05,2025-04-23,3,6,18,OP114
EQX1007,Excavator,,2025-03-20,2025-04-01,0,12,12,
```

---

## 2. Object shapes

### 2.1 AssetSummary (list rows)
```json
{
  "equipment_id": "EQX1002",
  "type": "Cater",
  "status": "OVERDUE",
  "site_id": null,
  "site_name": null,
  "operator_id": null,
  "operator_name": null,
  "customer": null,
  "location": null,
  "utilization_pct": 0,
  "engine_hours_per_day": 0,
  "idle_hours_per_day": 11,
  "operating_days": 20,
  "checkout_date": "2025-03-01",
  "checkin_date": "2025-03-30",
  "anomaly_count": 5,
  "highest_severity": "HIGH",
  "top_anomaly": { "code": "overdue_return", "severity": "HIGH", "summary": "43 days overdue" },
  "source": "official"
}
```
`location` is `{ "lat": number, "lon": number }` or `null` (unassigned/no telemetry).

### 2.2 Anomaly
```json
{
  "code": "low_utilization",
  "severity": "HIGH",
  "condition": "Productive utilization below 30%",
  "evidence": "EQX1002 recorded 0 engine hours/day and 11 idle hours/day across 20 operating days (0% utilization).",
  "values": { "utilization_pct": 0, "engine_hours_per_day": 0, "idle_hours_per_day": 11, "operating_days": 20 },
  "recommended_action": "Review customer requirement; consider early return or reallocation."
}
```
Anomaly `code` enum: `missing_site | missing_operator | zero_productive | low_utilization | excessive_idle | overdue_return | return_approaching | engine_overheat | unsafe_seatbelt | location_mismatch | abnormal_fuel`.

### 2.3 Alert (fleet feed; an anomaly promoted with asset + timestamp)
```json
{
  "id": "AL-EQX1002-overdue_return",
  "asset_id": "EQX1002",
  "code": "overdue_return",
  "severity": "HIGH",
  "message": "EQX1002 is 43 days overdue (expected 2025-03-30).",
  "recommended_action": "Recover the asset and update rental records.",
  "created_at": "2025-05-12T09:00:00"
}
```

### 2.4 TelemetryFrame
```json
{
  "asset_id": "EQX1004",
  "timestamp": "2025-05-12T09:15:00",
  "lat": 34.052, "lon": -117.421,
  "engine_on": true,
  "engine_hours": 2.3,
  "idle_minutes": 41,
  "fuel_pct": 62,
  "fuel_rate_lph": 18.4,
  "engine_temp_c": 112,
  "seatbelt": "OFF",
  "fault_code": "E-OVERHEAT"
}
```
`seatbelt`: `"ON" | "OFF"`. `fault_code`: string or `null`.

### 2.5 LifecycleEvent
```json
{
  "id": "EV-0007",
  "asset_id": "EQX1002",
  "timestamp": "2025-03-01T08:00:00",
  "type": "CHECKOUT",
  "title": "Checked out from dealership",
  "detail": "No site or operator assigned at checkout.",
  "actor": "Dealer Desk"
}
```
`type` enum: `CHECKOUT | SITE_ASSIGNED | OPERATOR_ASSIGNED | OPERATION_START | TELEMETRY_ALERT | SAFETY_EVENT | MAINTENANCE_FLAG | OVERDUE_FLAG | CHECKIN`.

### 2.6 Recommendation
```json
{
  "id": "REC-0003",
  "type": "allocation",
  "asset_id": "EQX1007",
  "target_site_id": "S003",
  "severity": "HIGH",
  "title": "Reallocate EQX1007 to S003",
  "rationale": "S003 is forecast to need ~3 excavators in June 2025; EQX1007 is an idle, unassigned excavator (0 productive hrs).",
  "action": "Recover EQX1007 and allocate it to S003."
}
```
`type` enum: `reallocation | maintenance | assignment | allocation | return`.

### 2.7 Forecast
```json
{
  "site_id": "S003",
  "equipment_type": "Excavator",
  "history": [ { "period": "2025-01", "count": 2 }, { "period": "2025-02", "count": 2 }, { "period": "2025-03", "count": 3 }, { "period": "2025-04", "count": 3 } ],
  "forecast": [ { "period": "2025-05", "count": 3 }, { "period": "2025-06", "count": 3 } ],
  "method": "3-month weighted moving average (weights 1-2-3), rounded",
  "expected_requirement": "~3 excavators/month at S003, rising trend.",
  "fillable_by": [ { "equipment_id": "EQX1007", "reason": "Excavator, expected available (overdue/recoverable)." } ]
}
```

---

## 3. Endpoints

### Fleet & assets
- `GET /api/assets` → `{ "assets": AssetSummary[] }` — full fleet (7 official + any synthetic-supplement rows flagged `source:"synthetic"` if added).
- `GET /api/assets/{id}` → `AssetDetail` = AssetSummary **plus**:
  ```json
  { "anomalies": Anomaly[], "recommendations": Recommendation[],
    "events": LifecycleEvent[], "telemetry_current": TelemetryFrame|null,
    "assignment": { "site_id": "...|null", "operator_id": "...|null", "customer": "...|null", "expected_checkin": "YYYY-MM-DD|null" } }
  ```
- `GET /api/assets/{id}/telemetry` → `{ "asset_id": "...", "frames": TelemetryFrame[] }` — full deterministic series for client-side playback (empty array if the asset has no active telemetry scenario).
- `GET /api/assets/{id}/events` → `{ "asset_id": "...", "events": LifecycleEvent[] }` — lifecycle timeline (ascending by timestamp).

### Alerts
- `GET /api/alerts` → `{ "alerts": Alert[] }` — every active anomaly across the fleet, sorted severity desc then asset_id. Supports optional `?severity=HIGH` and `?asset_id=EQX1002` filters.

### Sites & operators
- `GET /api/sites` → `{ "sites": [ { "site_id": "S003", "name": "...", "lat": .., "lon": .., "asset_count": 1 } ] }` (includes a dealership/depot marker).
- `GET /api/operators` → `{ "operators": [ { "operator_id": "OP101", "name": "...", "safety_score": 87 } ] }`.

### Lifecycle (check-in / check-out)
- `POST /api/assets/{id}/checkout` body `{ "site_id": "S003", "operator_id": "OP101", "customer": "Acme Mining", "expected_checkin": "2025-06-15" }` → `AssetDetail`. Records a `CHECKOUT` (+ `SITE_ASSIGNED`/`OPERATOR_ASSIGNED`) event, sets status `RENTED`. Manual entry and "QR scan" both post here (QR payload = the equipment_id string).
- `POST /api/assets/{id}/checkin` body `{ "notes": "..." }` → `AssetDetail`. Records a `CHECKIN` event, sets status `RETURNED`.

### Intelligence
- `GET /api/forecast?site_id=S003&type=Excavator` → `Forecast`. Both params optional; omitting returns a list under `{ "forecasts": Forecast[] }` for all (site,type) pairs that have history.
- `GET /api/recommendations` → `{ "recommendations": Recommendation[] }` — fleet-level, sorted severity desc. Includes reallocation, maintenance, assignment, allocation, and return recommendations derived from anomalies + forecast.

### Health
- `GET /api/health` → `{ "status": "ok", "demo_now": "2025-05-12T09:00:00", "asset_count": 7 }`.

---

## 4. Mock-first rule (unblocks parallel work)

Within the first hour, Jimmy ships **all** endpoints returning hardcoded JSON that matches these shapes (real values for EQX1002 / EQX1004 / EQX1003, plausible for the rest). Yash builds the entire frontend against these shapes immediately. Real computation replaces the mock bodies behind the identical contract — no frontend change required when it lands.
