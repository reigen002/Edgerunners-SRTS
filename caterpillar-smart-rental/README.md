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

## Frontend Quick Start (local)

```bash
# From the frontend directory (in a second terminal — backend must be running)
cd caterpillar-smart-rental/frontend

npm install
npm run dev
```

App available at <http://localhost:5173> — it talks to the backend at
`http://localhost:8000` by default (real API mode, no mock data). To point it
at a different backend URL or force mock mode, copy `.env.local.example` to
`.env.local` and see the comments inside.

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

## Manual Testing Walkthrough

With the backend on :8000 and frontend on :5173 both running, this walks
through every core capability by hand. Each step names what you should see —
if it doesn't match, something's broken.

1. **Health check.**
   `curl http://localhost:8000/health` → `{"status":"ok","service":"SRTS Backend"}`.

2. **Reset to a clean state.**
   Click **Reset Demo** in the app header (or `POST /admin/reset`). Confirm:
   7 assets, EQX1002 shown as `checked_out` with no site/operator, alerts
   regenerated.

3. **Fleet dashboard** (`/`).
   - All 7 assets appear in the fleet table, sorted by severity.
   - KPI row shows fleet size, assets needing attention, HIGH alerts, avg. utilization.
   - **EQX1002** is the hero panel at the top — CRITICAL, overdue.
   - Map renders all sites; no console errors.

4. **EQX1002 detail** (click the row, or go to `/asset/EQX1002`).
   Confirm: type `Cater`, status `Overdue`/`CRITICAL`, Site/Operator both
   `Unassigned`, 0 engine hrs/day, 11 idle hrs/day, 0% utilization,
   43 days overdue, 4 anomaly cards each with evidence + "why it matters",
   and a recommendation panel with a coherent, data-backed action.

5. **Telemetry scenarios** (on `/asset/EQX1004`, the asset still "out" at the
   demo clock).
   Pick a scenario from the dropdown and click **Run Scenario**:
   - `engine_overheat` → engine temp >105°C, CRITICAL anomaly, coaching
     checklist opens, a "predictive maintenance" recommendation appears.
   - `seatbelt_violation` → seatbelt reads OFF, HIGH anomaly + recommendation.
   - `location_mismatch` → asset shown outside its registered site boundary.
   - `high_idle` / `abnormal_fuel` — secondary/optional scenarios.

6. **Recommendations.**
   On the dashboard, confirm two distinct kinds of recommendation appear:
   anomaly-driven (EQX1002, EQX1007 — missing assignment / zero productive
   use) and forecast-driven allocation (see next step). EQX1002's recommendation
   should stay coherent even with multiple stacked conditions.

7. **Forecast → supply → allocation** (dashboard forecast panel, or
   `GET /forecasts?equipment_type=Excavator&site_id=S003`).
   Confirm the S003/Excavator panel shows: history `2,2,2,3,3,3` → forecast
   `~3`, known supply `1 available + 1 recoverable = 2`, projected gap `1`,
   and the action **"Recover EQX1007 and redeploy to S003."** — phrased as
   reducing the gap, not fully solving it.

8. **Check-out / check-in** (use EQX1006, which starts `Returned`).
   - **Check Out**: fill site + operator + expected return date → status
     flips to `Rented`, a CHECKOUT event appears on the Lifecycle Timeline.
   - **Check In**: status flips back to `Returned`, a CHECKIN event is
     added, and — importantly — **no new alerts appear** (a returned asset
     having no active site/operator is not an anomaly).
   - Repeating an invalid action (e.g. checking in an already-returned
     asset) should fail cleanly (`409`) without breaking the UI.

9. **Lifecycle timeline sanity check.**
   EQX1002 → `Checked out` (2025-03-01) then `Flagged overdue` (2025-03-30),
   no check-in. EQX1005 or EQX1003 → a clean `Checked out` → `Returned to
   dealership` pair. Every asset should have a non-empty timeline on a fresh
   reset — this is generated from the official dataset at seed time, not
   just from live check-in/out actions.

10. **Reset reproducibility.**
    After doing steps 5–8, click **Reset Demo** again and re-check step 2 —
    the fleet should return to *exactly* the original seeded state (same
    alert count, same EQX1002 fields), with no manual DB editing needed.

11. **Build/test sanity** (optional, confirms the code itself is healthy):

    ```bash
    cd caterpillar-smart-rental/backend && uv sync --extra dev && uv run pytest -q
    cd caterpillar-smart-rental/frontend && npm run build
    ```

    Expect `95 passed` and a clean Vite build.

---

## Utilization Methodology

Two metrics are surfaced (not a composite "magic number"):

- **Productive ratio** = `engine_hrs / (engine_hrs + idle_hrs) × 100`  
  *How much of running time was productive?*

- **Shift utilization** = `engine_hrs / (operating_days × 8h) × 100`  
  *How much of available shift capacity was used?*

Both include a plain-English label so the frontend can explain the number to end users.
