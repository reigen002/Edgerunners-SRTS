# SRTS Demo Flow — One 5-Minute Story

> **Narrative spine:** *Know → Detect → Explain → Predict → Act* (HACKATHON_SPEC §13). One dealer, one afternoon, one fleet — not a feature tour. Everything below uses the **official** dataset (§8) at the fixed clock `DEMO_NOW = 2025-05-12`.

## Cast (chosen from the real data)

| Asset | Role in story | Why |
|---|---|---|
| **EQX1002** | **Hero / villain** | Only asset that stacks NULL site + NULL operator + 0 engine hrs + 11 idle + 20 days + **43 days overdue**. Carries Know→Detect→Explain→Act alone. |
| **EQX1007** | Payoff asset | Idle, unassigned **excavator** → recoverable → fills the S003 excavator forecast (links anomaly story to allocation). |
| **EQX1004** | Live/safety asset | Only row still "out" at DEMO_NOW (checkin 2025-05-15) → coherent live telemetry + overheat + seatbelt scene + check-in. |
| **EQX1003 / EQX1005** | Healthy contrast | 94% / 100% utilization → proves the system isn't crying wolf. |

---

## The 5 minutes, scene by scene

**0:00 — KNOW (Dashboard).** "This is a Caterpillar dealer's rented fleet — 7 machines out in the field." Point at KPIs: fleet size, **assets needing attention**, HIGH alerts, avg utilization. The table is color-coded; **EQX1002 is red at the top**. The map shows sites; two markers have no home. *One glance = the dealer knows something's wrong.*

**0:45 — DETECT + EXPLAIN (EQX1002 detail).** Click EQX1002. Header: **Unassigned · Overdue**. Assignment card: Site *Unassigned*, Operator *Unassigned*. Utilization chart: **0% productive, 11 idle hrs/day**. Anomaly cards read like a human wrote them:
> "EQX1002 has no assigned site or operator and recorded 0 engine hours/day with 11 idle hours/day across 20 operating days (0% utilization). It was due back 2025-03-30 — **43 days overdue**."

Each card shows **condition → evidence → severity → action**. *No black box — every number is on screen.*

**1:45 — ACT (recommendation + lifecycle).** Recommendation panel: **"Recover EQX1002; review customer utilization; consider reallocation."** Open its lifecycle timeline: CHECKOUT 2025-03-01 → **OVERDUE_FLAG 2025-03-30** → …nothing. "It left the yard 10 weeks ago and never came back, and nobody knew." Contrast one click on EQX1005: clean CHECKOUT→CHECKIN, 100% utilization — *the system rewards good assets and flags bad ones.*

**2:45 — PREDICT (forecast).** Open the forecast panel for **S003 / Excavator**: history climbing 2→2→3→3, forecast **~3 for June 2025**, method shown ("3-month weighted moving average"). "S003 keeps needing excavators — and demand is rising."

**3:15 — PREDICT → ACT (allocation).** Recommendation: **"Recover EQX1007 (idle, unassigned excavator) and allocate it to S003."** "The forecast just told us where the overdue excavator should go. Investigation became a business decision."

**3:45 — LIVE + SAFETY (EQX1004).** Switch to EQX1004 — the one machine actually working today. Hit **play** on telemetry: marker moves along its route, gauges tick. Mid-playback the **engine temp crosses 105 °C** and **seatbelt reads OFF** → two HIGH alerts fire on cue → **predictive-maintenance recommendation** ("inspect cooling system before continued operation") + **operator coaching** opens (seatbelt checklist). *Detect → Alert → Recommendation → Coaching, live.*

**4:30 — ACT (check-in).** EQX1004 is due back in 3 days. Click **Check In** (or "scan" its QR = its ID), add a note. Status flips to **RETURNED**, a CHECKIN event lands on the timeline, its overdue/approaching alerts clear. "Full custody, closed loop — Dealership → Site → Operation → Return."

**4:50 — Close.** Back to dashboard: "One screen took this dealer from *I don't know where my fleet is* to *recover EQX1002, send EQX1007 to S003, service EQX1004* — every decision backed by data." Land on the value line: **visibility, utilization, safety, allocation.**

---

## DEMO CHECKLIST (run twice before freeze, again Day 2)

- [ ] `scripts/dev.sh` starts backend (:8000) and frontend (:5173) cleanly.
- [ ] `GET /api/health` → `demo_now: 2025-05-12`, `asset_count: 7`.
- [ ] Dashboard: EQX1002 red/top; KPIs populated; map renders all sites.
- [ ] EQX1002 detail: NULLs shown as *Unassigned*; 0% utilization; ≥5 anomalies with evidence + actions; overdue = 43 days.
- [ ] EQX1005 detail: 100% utilization, clean CHECKOUT→CHECKIN, no util/idle anomalies.
- [ ] Forecast S003/Excavator: rising history + ~3 forecast + method string.
- [ ] Recommendations: EQX1007→S003 allocation (HIGH) present with rationale.
- [ ] EQX1004 telemetry plays; overheat + seatbelt fire at the scripted frame; coaching opens.
- [ ] Check-in EQX1004 → RETURNED, timeline event added, alerts cleared.
- [ ] Re-run backend → telemetry series identical (determinism holds).
- [ ] Backup screen recording captured.

## Fallbacks (if something breaks live)

- Telemetry won't play → screenshot the overheat frame + read the alert; the anomaly still exists in `/api/alerts`.
- Map tiles slow → static site markers still render; narrate from the table.
- Any live action fails → the backup recording covers the full A–E arc.
