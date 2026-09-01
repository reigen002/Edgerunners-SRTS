# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 18 + Vite + Tailwind CSS, React Router, Leaflet for the map, Recharts for charts. Decided in `docs/IMPLEMENTATION_PLAN.md` §8/§9 (hackathon team plan), not delegated to Impeccable.

## Users

Caterpillar dealer operations staff (a dealer's rental desk / fleet manager) monitoring machines they have rented out to customers on active job sites. They are not the equipment operators — they are the desk that must know where every rented machine is, whether it is being used, and what to do about it.

## Product Purpose

A Smart Rental Tracking System (SRTS) that turns raw rental/telemetry data into dealer decisions: know the fleet, detect problems, explain them with evidence, predict demand, and act (check-in/out, reallocate, recover). Success = a dealer can look at one screen and know which asset needs attention, why, and what to do next — source: `docs/HACKATHON_SPEC.md` §3, §13.

## Positioning

Every anomaly, forecast, and recommendation is backed by inspectable evidence (condition → evidence → severity → action) computed from real asset/telemetry numbers — never an unexplained "AI detected an issue." This is the explicit differentiator called out in `docs/HACKATHON_SPEC.md` §14.

## Operating Context

Desk-based, single-session review during a dealer's workday; also the live 5-minute hackathon demo (`docs/DEMO_FLOW.md`) which judges watch on a screen. Primary workflow: Fleet Dashboard → find a problem asset → Asset Detail (assignment, usage, telemetry, anomalies) → alert → recommendation → forecast/allocation → check-in/out → lifecycle history.

## Capabilities and Constraints

- Official 7-asset dataset (`docs/HACKATHON_SPEC.md` §8) is read-only and authoritative; `NULL` site/operator are meaningful states shown as "Unassigned," never hidden.
- Deterministic demo clock `DEMO_NOW = 2025-05-12T09:00:00` — all status/overdue logic is computed against this fixed value, never wall-clock time.
- Frontend built mock-first against the frozen `docs/API_CONTRACT.md` shapes; swapping the mock layer for the real backend (Jimmy's FastAPI service) must require no shape changes.
- No auth/multi-user, no chatbot (lowest priority, build only if everything else is done), no production infra — this is a hackathon MVP vertical slice, not a production platform (`docs/HACKATHON_SPEC.md` §16, §26).
- Hero anomaly asset: EQX1002 (no site, no operator, 0 engine hrs/day, 11 idle hrs/day, 20 operating days, 43 days overdue) — the UI must make its operational significance legible at a glance without fabricating evidence.

## Brand Commitments

Caterpillar-*adjacent* industrial dealer-ops feel (the product is built for CAT dealers) but this is not an official Caterpillar-branded product — must not imitate Caterpillar's registered trademark, logo, or trade dress. No existing app name/logo yet.

## Evidence on Hand

Real data: the official 7-row asset table (`docs/HACKATHON_SPEC.md` §8), the frozen object shapes and endpoints (`docs/API_CONTRACT.md`), and the full seed/synthetic data plan (`docs/IMPLEMENTATION_PLAN.md` §19). No real screenshots, logos, or customer testimonials exist — none should be fabricated.

## Product Principles

- One coherent story (Know → Detect → Explain → Predict → Act), not a feature tour.
- Every number on screen is real and traceable to source data; no invented evidence.
- Operational clarity and scan speed over decoration — this is a working tool, not a marketing site.
- NULL/missing data is signal, always shown, never swallowed.
- Demo determinism: identical output on every run of the same data.
