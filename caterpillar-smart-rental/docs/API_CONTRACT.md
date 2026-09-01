# SRTS API Contract

Base URL: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs` (Swagger UI)

---

## Conventions

- All timestamps are ISO 8601 UTC (`2025-04-01T00:00:00Z`)
- All IDs are strings
- `null` fields in responses are intentional (e.g. unassigned site/operator)
- HTTP 404 → asset not found; 409 → business rule conflict

---

## Assets

### `GET /assets`

List all assets in the fleet.

**Query params:** `equipment_type`, `status`, `site_id`

**Response:** `AssetSummary[]`

```json
[
  {
    "id": "EQX1001",
    "equipment_type": "Excavator",
    "status": "available",
    "site_id": "S003",
    "operator_id": "OP101",
    "checkout_date": "2025-04-01T00:00:00Z",
    "expected_return_date": "2025-04-16T00:00:00Z",
    "engine_hrs_per_day": 1.5,
    "idle_hrs_per_day": 10.0,
    "operating_days": 15,
    "customer_name": "ABC Construction",
    "qr_code": "QR-EQX1001",
    "rfid_tag": "RFID-EQX1001"
  }
]
```

---

### `GET /assets/{asset_id}`

Full asset detail including utilization metrics.

**Response:** `AssetDetail` (extends `AssetSummary`)

```json
{
  "id": "EQX1001",
  "...": "...",
  "site": { "id": "S003", "name": "East Infrastructure Hub", "latitude": 14.676, "longitude": 121.0437 },
  "operator": { "id": "OP101", "name": "Juan dela Cruz", "license_class": "Heavy" },
  "utilization": {
    "engine_hrs_total": 22.5,
    "idle_hrs_total": 150.0,
    "operating_days": 15,
    "productive_ratio_pct": 13.0,
    "shift_utilization_pct": 18.8,
    "label": "22h engine / 150h idle over 15 days — 13.0% productive time, 18.8% of single-shift capacity."
  }
}
```

---

### `GET /assets/{asset_id}/telemetry`

Recent telemetry (newest first).

**Query params:** `limit` (default 50, max 500), `scenario`

**Response:** `TelemetryOut[]`

```json
[
  {
    "id": 1,
    "asset_id": "EQX1001",
    "timestamp": "2025-04-10T08:00:00Z",
    "latitude": 14.676,
    "longitude": 121.0437,
    "engine_temp_c": 87.3,
    "engine_hours": 22.5,
    "fuel_level_pct": 72.0,
    "fuel_consumption_lph": 12.1,
    "idle_time_hours": 150.0,
    "seatbelt_on": true,
    "fault_code": null,
    "fault_description": null,
    "scenario": "normal"
  }
]
```

---

### `GET /assets/{asset_id}/events`

Lifecycle events (newest first).

**Query params:** `limit`

**Response:** `RentalEventOut[]`

---

### `POST /assets/{asset_id}/checkout`

Check out an asset.

**Body:**

```json
{
  "operator_id": "OP101",
  "site_id": "S003",
  "customer_name": "ABC Construction",
  "expected_return_date": "2025-04-16T00:00:00Z",
  "notes": "Routine rental",
  "performed_by": "Desk Agent",
  "identifier_method": "qr"
}
```

**Response:** `RentalEventOut` (409 if already checked out)

---

### `POST /assets/{asset_id}/checkin`

Return an asset.

**Body:**

```json
{
  "notes": "Returned in good condition",
  "performed_by": "Desk Agent",
  "identifier_method": "rfid"
}
```

**Response:** `RentalEventOut` (409 if not checked out)

---

### `POST /assets/{asset_id}/simulate`

Trigger a deterministic demo telemetry scenario.

**Body:**

```json
{
  "scenario": "engine_overheat",
  "readings": 10
}
```

**Scenarios:** `normal` | `engine_overheat` | `location_mismatch` | `seatbelt_violation` | `high_idle` | `abnormal_fuel`

**Response:** `TelemetryOut[]`

---

## Alerts

### `GET /alerts`

List alerts.

**Query params:** `asset_id`, `alert_type`, `severity`, `resolved` (default `false`)

**Alert types:** `overdue` | `no_operator` | `no_site` | `high_idle` | `engine_overheat` | `location_mismatch` | `seatbelt_violation` | `abnormal_fuel` | `low_utilization`

**Severity:** `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`

**Response:**

```json
[
  {
    "id": 1,
    "asset_id": "EQX1002",
    "alert_type": "no_site",
    "severity": "HIGH",
    "message": "Asset EQX1002 has no assigned site.",
    "evidence": "site_id is NULL — asset cannot be located or dispatched.",
    "resolved": false,
    "created_at": "2025-09-01T10:00:00Z",
    "resolved_at": null
  }
]
```

---

### `POST /alerts/refresh`

Re-run anomaly detection across all assets. Returns newly generated alerts.

---

## Recommendations

### `GET /recommendations`

Return actionable recommendations for all assets with detected issues, ordered by severity.

**Response:**

```json
[
  {
    "asset": "EQX1002",
    "issue": "Underutilized / unassigned",
    "severity": "HIGH",
    "evidence": "220h cumulative idle time over 20 days with zero engine hours. Asset is powered on but not working.",
    "recommendation": "Review rental requirement and consider reallocating the asset. If there is no active work order, return the asset to the dealership to avoid unnecessary rental cost and wear."
  }
]
```

---

## Forecasts

### `GET /forecasts`

Demand forecasts by equipment type.

**Query params:** `equipment_type`, `site_id`

**Response:**

```json
[
  {
    "equipment_type": "Excavator",
    "site_id": null,
    "history": [
      { "period": "2025-03", "demand": 12.0, "is_forecast": false },
      { "period": "2025-04", "demand": 15.0, "is_forecast": false }
    ],
    "forecast": [
      { "period": "2025-05", "demand": 14.5, "is_forecast": true },
      { "period": "2025-06", "demand": 14.7, "is_forecast": true },
      { "period": "2025-07", "demand": 14.9, "is_forecast": true }
    ],
    "expected_returning": [],
    "recommended_allocation": 1,
    "allocation_rationale": "3-month moving average: 13.5 asset-days/month. Trend: demand is trending up (+1.5 days/month). Recommended fleet of 1 unit(s) covers peak projected demand of 15 asset-days assuming 30 active days/unit/month."
  }
]
```

---

## Admin

### `POST /admin/seed`

Insert seed data if missing. Idempotent.

### `POST /admin/reset`

Delete all data and re-seed. Use between demo runs.

---

## Health

### `GET /health`

```json
{ "status": "ok", "service": "SRTS Backend" }
```
