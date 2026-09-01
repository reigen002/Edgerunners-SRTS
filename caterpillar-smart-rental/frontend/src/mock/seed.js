// Deterministic seed data for the SRTS mock layer.
// Official dataset is verbatim from docs/HACKATHON_SPEC.md §8 / docs/API_CONTRACT.md §1 — never altered.
export const DEMO_NOW = "2025-05-12T09:00:00";

export const OFFICIAL_ASSETS = [
  { equipment_id: "EQX1001", type: "Excavator", site_id: "S003", checkout_date: "2025-04-01", checkin_date: "2025-04-16", engine_hours_per_day: 1.5, idle_hours_per_day: 10, operating_days: 15, last_operator_id: "OP101" },
  { equipment_id: "EQX1002", type: "Cater", site_id: null, checkout_date: "2025-03-01", checkin_date: "2025-03-30", engine_hours_per_day: 0, idle_hours_per_day: 11, operating_days: 20, last_operator_id: null },
  { equipment_id: "EQX1003", type: "Bulldozer", site_id: "S002", checkout_date: "2025-02-15", checkin_date: "2025-03-11", engine_hours_per_day: 7.5, idle_hours_per_day: 0.5, operating_days: 25, last_operator_id: "OP203" },
  { equipment_id: "EQX1004", type: "Grader", site_id: "S004", checkout_date: "2025-05-05", checkin_date: "2025-05-15", engine_hours_per_day: 2, idle_hours_per_day: 9, operating_days: 10, last_operator_id: "OP106" },
  { equipment_id: "EQX1005", type: "Bulldozer", site_id: "S006", checkout_date: "2025-01-01", checkin_date: "2025-01-31", engine_hours_per_day: 8, idle_hours_per_day: 0, operating_days: 30, last_operator_id: "OP301" },
  { equipment_id: "EQX1006", type: "Grader", site_id: "S001", checkout_date: "2025-04-05", checkin_date: "2025-04-23", engine_hours_per_day: 3, idle_hours_per_day: 6, operating_days: 18, last_operator_id: "OP114" },
  { equipment_id: "EQX1007", type: "Excavator", site_id: null, checkout_date: "2025-03-20", checkin_date: "2025-04-01", engine_hours_per_day: 0, idle_hours_per_day: 12, operating_days: 12, last_operator_id: null },
];

// Supplementary synthetic data (clearly not part of the official handout).
export const SITES = [
  { site_id: "S001", name: "Redstone Quarry", lat: 34.0522, lon: -117.4213, region: "Inland Empire" },
  { site_id: "S002", name: "Cienega Grading Yard", lat: 34.0139, lon: -117.4795, region: "Inland Empire" },
  { site_id: "S003", name: "Foothill Excavation Site", lat: 34.1064, lon: -117.2898, region: "Inland Empire" },
  { site_id: "S004", name: "Northgate Infrastructure Project", lat: 34.1420, lon: -117.3540, region: "Inland Empire" },
  { site_id: "S005", name: "Valley Interchange Build", lat: 33.9806, lon: -117.3755, region: "Inland Empire" },
  { site_id: "S006", name: "Basin Reservoir Works", lat: 34.0783, lon: -117.5921, region: "Inland Empire" },
  { site_id: "DEPOT", name: "Dealer Depot", lat: 34.0600, lon: -117.4300, region: "Inland Empire" },
];

export const OPERATORS = [
  { operator_id: "OP101", name: "Marcus Webb", safety_score: 91 },
  { operator_id: "OP106", name: "Dana Ruiz", safety_score: 58 },
  { operator_id: "OP114", name: "Teo Alvarez", safety_score: 88 },
  { operator_id: "OP203", name: "Priya Nair", safety_score: 95 },
  { operator_id: "OP301", name: "Sam O'Keefe", safety_score: 97 },
];

export const CUSTOMERS = [
  { customer_id: "C01", name: "Redstone Aggregates" },
  { customer_id: "C02", name: "Cienega Grading Co." },
  { customer_id: "C03", name: "Foothill Civil Works" },
  { customer_id: "C04", name: "Northgate Infrastructure LLC" },
  { customer_id: "C05", name: "Basin Reservoir Authority" },
];

// current_state: RENTED | RETURNED — drives which assets are "still out" at DEMO_NOW.
export const ASSET_STATE = {
  EQX1001: { current_state: "RETURNED", site_id: "S003", operator_id: "OP101", customer_id: "C03", expected_checkin: "2025-04-16" },
  EQX1002: { current_state: "RENTED", site_id: null, operator_id: null, customer_id: null, expected_checkin: "2025-03-30" },
  EQX1003: { current_state: "RETURNED", site_id: "S002", operator_id: "OP203", customer_id: "C02", expected_checkin: "2025-03-11" },
  EQX1004: { current_state: "RENTED", site_id: "S004", operator_id: "OP106", customer_id: "C04", expected_checkin: "2025-05-15" },
  EQX1005: { current_state: "RETURNED", site_id: "S006", operator_id: "OP301", customer_id: "C05", expected_checkin: "2025-01-31" },
  EQX1006: { current_state: "RETURNED", site_id: "S001", operator_id: "OP114", customer_id: "C01", expected_checkin: "2025-04-23" },
  EQX1007: { current_state: "RENTED", site_id: null, operator_id: null, customer_id: null, expected_checkin: "2025-04-01" },
};

// Canonical source moved to lib/format.js (shared with real-mode display
// coloring); re-exported here so mock/engine.js's existing import keeps working.
export { DISPLAY_THRESHOLDS as ANOMALY_THRESHOLDS } from "../lib/format";

// site_id, equipment_type, period (YYYY-MM), count — rising S003/Excavator trend powers the forecast demo.
export const DEMAND_HISTORY = [
  { site_id: "S003", equipment_type: "Excavator", period: "2025-01", count: 2 },
  { site_id: "S003", equipment_type: "Excavator", period: "2025-02", count: 2 },
  { site_id: "S003", equipment_type: "Excavator", period: "2025-03", count: 3 },
  { site_id: "S003", equipment_type: "Excavator", period: "2025-04", count: 3 },
  { site_id: "S002", equipment_type: "Bulldozer", period: "2025-01", count: 1 },
  { site_id: "S002", equipment_type: "Bulldozer", period: "2025-02", count: 1 },
  { site_id: "S002", equipment_type: "Bulldozer", period: "2025-03", count: 1 },
  { site_id: "S002", equipment_type: "Bulldozer", period: "2025-04", count: 1 },
  { site_id: "S001", equipment_type: "Grader", period: "2025-01", count: 1 },
  { site_id: "S001", equipment_type: "Grader", period: "2025-02", count: 1 },
  { site_id: "S001", equipment_type: "Grader", period: "2025-03", count: 1 },
  { site_id: "S001", equipment_type: "Grader", period: "2025-04", count: 2 },
];

// Telemetry scenario params — only assets genuinely "out" at DEMO_NOW get a live scenario.
// Route interpolates linearly between waypoints; overheat/seatbelt fire at a fixed frame index.
export const TELEMETRY_SCENARIOS = {
  EQX1004: {
    waypoints: [
      [34.1420, -117.3540],
      [34.1447, -117.3487],
      [34.1466, -117.3421],
      [34.1489, -117.3362],
    ],
    frame_count: 24,
    interval_minutes: 15,
    base_temp_c: 82,
    temp_ramp_at_frame: 16,
    temp_ramp_c_per_frame: 4.2,
    seatbelt_off_frames: [17, 18, 19, 20, 21, 22, 23],
    base_fuel_pct: 74,
    fuel_rate_lph: 16.2,
    fault_at_frame: { frame: 18, code: "E-OVERHEAT" },
  },
};

export const COACHING = {
  unsafe_seatbelt: {
    title: "Seatbelt Compliance Coaching",
    checklist: [
      "Stop the machine safely before continuing.",
      "Confirm the operator fastens the seatbelt before resuming operation.",
      "Review the seatbelt policy with the operator on-site.",
      "Log the coaching conversation on the asset's event timeline.",
    ],
  },
  engine_overheat: {
    title: "Engine Overheat Response",
    checklist: [
      "Idle the engine and allow it to cool before shutdown.",
      "Check coolant level and radiator for obstruction.",
      "Do not resume operation until cooling system is inspected.",
      "Flag the asset for maintenance before its next rental.",
    ],
  },
  low_utilization: {
    title: "Underutilization Review",
    checklist: [
      "Contact the customer to confirm ongoing need for the asset.",
      "Compare against site demand forecast before extending the rental.",
      "Consider early return or reallocation to a higher-demand site.",
    ],
  },
};
