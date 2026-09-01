---
version: 1
slug: "caterpillar-smart-rental-frontend"
primary_target: "caterpillar-smart-rental/frontend"
related_targets: []
---

## Scope and visitor mode

Operate. The Caterpillar dealer's rental desk uses this daily (and judges watch it live for 5 minutes) to go from "something's wrong" to "here's the fix" as fast as possible. Two screens: Fleet Dashboard, Asset Detail.

Audience, job, action/task, proof/content, constraints: dealer ops staff scanning a small fleet (7-10 assets) for problems, then drilling into one asset for evidence and taking action (checkout/checkin, review recommendation). Every number must be real, sourced from the official dataset or deterministic synthetic data. Constraint: no Caterpillar trademark/logo use; CAT-adjacent industrial feel via material language (safety yellow, machined charcoal, gauge typography), not branding.

## Direction contract

THESIS: This is a machine-monitoring instrument panel, not a SaaS admin template — status reads the way a piece of heavy equipment's own dash reads: at a glance, in industrial signal color, no ambiguity. Refuses the generic soft-shadow/rounded-card AI-dashboard default.

OWN-WORLD: Near-black charcoal ground (#14161a), raised panels one step lighter (#1c1f26) with a hairline border, not shadows. One committed accent — CAT safety yellow (#ffc72c) used *only* for HIGH severity / attention-required signal, never decoratively. Status uses a fixed 4-color signal set (yellow=HIGH, amber=MEDIUM, blue-gray=info/LOW, green=healthy/RETURNED) applied as left-edge bars and small pills, not full-card washes. Typography: system UI stack at a dense, tabular-numeric scale (mono for IDs/numbers, sans for labels) — a fleet table reads like a manifest, not a marketing card grid. Square-cornered or barely-rounded (2-4px) controls; no glassmorphism, no gradients.

STORY: Dealer opens the dashboard, the eye lands on KPI strip then the one red row (EQX1002) at the top of the table without scanning. Click through, the detail page reads like a service report: identity header, assignment card, utilization bar chart, anomaly cards each with condition→evidence→severity→action, telemetry gauges, timeline, recommendation, check-in/out action. Nothing is hidden behind a tab the judge has to hunt for.

FIRST VIEWPORT: Dashboard — top bar (product name, DEMO_NOW clock) · KPI strip (4 stat tiles: fleet size, needs attention, HIGH alerts, avg utilization) · below it a two-column split: fleet table (left, ~65%) sorted by severity, color-coded left-edge bar per row; alerts feed + map (right, ~35%) stacked. EQX1002's red bar is visible without scrolling at 1280px+.

FORM: Restrained color strategy (neutrals + one committed accent), industrial instrument-panel material world. Code-led (no image-generation tool available this session; ambition carried here and audited at finish, per Impeccable new-work.md, in place of the full dice-roll/decision-page ceremony — substituted given hackathon time constraints per explicit user instruction to move fast).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions

None — proceeding code-led directly given time constraints; will self-review against craft-floor.md before calling this done.
