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

OWN-WORLD: Near-black charcoal ground (#14161a), raised panels one step lighter (#1c1f26) with a hairline border, not shadows. Two committed signal accents, not one: alarm red (#ff4438) for CRITICAL and safety yellow (#ffc72c) for HIGH — a real gauge cluster never collapses "caution" and "alarm" into a single lamp color, and one accent for both severities read as flat. Action controls (Check In, Run Scenario, Reset Demo) stay on brand-yellow regardless of severity — the product's action color, a distinct job from status signaling. Status uses a fixed signal set (red=CRITICAL, yellow=HIGH, amber=MEDIUM, blue-gray=info/LOW, green=healthy/RETURNED) applied as severity-tinted card/row borders, backgrounds washes, and small pills — never a decorative edge bar. Typography: system UI stack at a dense, tabular-numeric scale (mono for IDs/numbers, sans for labels), sized generously enough to scan at a glance rather than cramped — a fleet table reads like a manifest, not a marketing card grid. Square-cornered or barely-rounded (2-4px) controls; no glassmorphism, no gradients.

STORY: Dealer opens the dashboard, the eye lands on the KPI strip then the hero panel — the anomalous asset whose recovery also closes a forecasted allocation gap (EQX1007), while the fleet table and alerts feed still surface EQX1002's CRITICAL/overdue alert in undiluted alarm red. Click through, the detail page reads like a service report: identity header, assignment card, utilization bar chart, anomaly cards each with condition→evidence→severity→action, telemetry gauges, a deliberately prominent lifecycle timeline (raised panel, larger ringed markers on the current state), recommendation, check-in/out action. Nothing is hidden behind a tab the judge has to hunt for.

FIRST VIEWPORT: Dashboard — top bar (product name, DEMO_NOW clock) · KPI strip (4 stat tiles: fleet size, needs attention, HIGH alerts, avg utilization) · below it the hero panel, then a two-column split: fleet table (left, ~65%) sorted by severity, severity-tinted row wash + colored asset-ID text; alerts feed + map (right, ~35%) stacked. Both the CRITICAL-red and HIGH-yellow rows are visible without scrolling at 1280px+.

FORM: Two-tier signal-color strategy (neutrals + red alarm + yellow caution, one shared action accent) over an industrial instrument-panel material world. Code-led (no image-generation tool available this session; ambition carried here and audited at finish, per Impeccable new-work.md, in place of the full dice-roll/decision-page ceremony — substituted given hackathon time constraints per explicit user instruction to move fast). Amended in a later session, at explicit user request, to split CRITICAL from HIGH and to raise the lifecycle timeline's visual weight; verified via the mechanical detector (zero findings) and manual desktop/mobile screenshots.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions

None — proceeding code-led directly given time constraints; will self-review against craft-floor.md before calling this done.
