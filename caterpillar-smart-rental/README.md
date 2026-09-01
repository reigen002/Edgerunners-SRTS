# SRTS — Smart Rental Tracking System

Caterpillar dealer backend for rental asset tracking, telemetry, anomaly detection, and demand forecasting.

---

## Stack

| Layer | Tech |
|---|---|
| Runtime | Python 3.11 |
| Package manager | **uv** |
| API | FastAPI |
| DB | SQLite (via SQLAlchemy 2.0) |
| Server | Uvicorn |

SQLite is used for hackathon simplicity — zero external infrastructure required.

---

## Quick Start (local)

```bash
# From the backend directory
cd caterpillar-smart-rental/backend

# Install uv (once, if not already installed)
# See https://docs.astral.sh/uv/getting-started/installation/

# Create venv and install dependencies
uv sync

# Run (auto-seeds DB on first start)
uv run uvicorn app.main:app --reload
```

API available at <http://localhost:8000>
Swagger UI: <http://localhost:8000/docs>

---

## Docker

```bash
cd caterpillar-smart-rental
docker compose up --build
```

---

## Database

SQLite file: `backend/srts.db`  
Auto-created and seeded on first startup.

**Reset to clean seed data:**

```bash
curl -X POST http://localhost:8000/admin/reset
```

---

## Key Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/assets` | List all assets |
| GET | `/assets/{id}` | Asset detail + utilization |
| GET | `/assets/{id}/telemetry` | Sensor readings |
| GET | `/assets/{id}/events` | Lifecycle events |
| POST | `/assets/{id}/checkout` | Check out asset |
| POST | `/assets/{id}/checkin` | Return asset |
| POST | `/assets/{id}/simulate` | Run telemetry demo scenario |
| GET | `/alerts` | Active anomaly alerts |
| POST | `/alerts/refresh` | Re-run anomaly detection |
| GET | `/recommendations` | Actionable recommendations |
| GET | `/forecasts` | Demand forecasting |
| POST | `/admin/reset` | Reset to seed data |

See [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) for full contract.

---

## Demo Scenarios

Trigger realistic telemetry with `POST /assets/{id}/simulate`:

| Scenario | What it simulates |
|---|---|
| `engine_overheat` | Temp rises above 110°C |
| `location_mismatch` | GPS drifts outside site boundary |
| `seatbelt_violation` | Seatbelt off during operation |
| `high_idle` | Engine idle, no productive use |
| `abnormal_fuel` | Fuel burn 2–3× baseline |
| `normal` | Healthy baseline readings |

---

## Utilization Methodology

Two metrics are surfaced (not a composite "magic number"):

- **Productive ratio** = `engine_hrs / (engine_hrs + idle_hrs) × 100`  
  *How much of running time was productive?*

- **Shift utilization** = `engine_hrs / (operating_days × 8h) × 100`  
  *How much of available shift capacity was used?*

Both include a plain-English label so the frontend can explain the number to end users.
