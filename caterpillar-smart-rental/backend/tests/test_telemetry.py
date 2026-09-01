"""
test_telemetry.py — all 5 demo scenarios are deterministic and produce correct signals.
"""
import pytest


SCENARIOS = [
    "normal",
    "engine_overheat",
    "location_mismatch",
    "seatbelt_violation",
    "high_idle",
    "abnormal_fuel",
]


class TestSimulateEndpoint:
    def test_each_scenario_returns_readings(self, client):
        for scenario in SCENARIOS:
            resp = client.post(
                "/assets/EQX1001/simulate",
                json={"scenario": scenario, "readings": 5},
            )
            assert resp.status_code == 200, f"Scenario {scenario!r} failed: {resp.text}"
            data = resp.json()
            assert len(data) == 5, f"Expected 5 readings, got {len(data)} for {scenario!r}"

    def test_invalid_scenario_returns_400(self, client):
        resp = client.post(
            "/assets/EQX1001/simulate",
            json={"scenario": "not_a_scenario", "readings": 3},
        )
        assert resp.status_code == 400

    def test_simulate_nonexistent_asset_returns_404(self, client):
        resp = client.post(
            "/assets/EQX9999/simulate",
            json={"scenario": "normal", "readings": 3},
        )
        assert resp.status_code == 404


class TestEngineOverheat:
    def test_temp_exceeds_threshold(self, client):
        resp = client.post(
            "/assets/EQX1001/simulate",
            json={"scenario": "engine_overheat", "readings": 10},
        )
        readings = resp.json()
        temps = [r["engine_temp_c"] for r in readings if r["engine_temp_c"] is not None]
        assert any(t >= 110.0 for t in temps), f"No overheat reading found: {temps}"

    def test_fault_code_present(self, client):
        resp = client.post(
            "/assets/EQX1001/simulate",
            json={"scenario": "engine_overheat", "readings": 8},
        )
        codes = [r["fault_code"] for r in resp.json() if r["fault_code"]]
        assert len(codes) > 0


class TestSeatbeltViolation:
    def test_seatbelt_off_appears(self, client):
        resp = client.post(
            "/assets/EQX1001/simulate",
            json={"scenario": "seatbelt_violation", "readings": 8},
        )
        seatbelts = [r["seatbelt_on"] for r in resp.json()]
        assert False in seatbelts, "No seatbelt_violation reading found"


class TestLocationMismatch:
    def test_location_drift_fault_code(self, client):
        resp = client.post(
            "/assets/EQX1001/simulate",
            json={"scenario": "location_mismatch", "readings": 10},
        )
        codes = [r["fault_code"] for r in resp.json() if r["fault_code"]]
        assert any(c.startswith("L") for c in codes), f"No L-prefixed fault code: {codes}"


class TestHighIdle:
    def test_idle_time_grows(self, client):
        resp = client.post(
            "/assets/EQX1001/simulate",
            json={"scenario": "high_idle", "readings": 8},
        )
        readings = resp.json()
        idles = [r["idle_time_hours"] for r in readings if r["idle_time_hours"] is not None]
        # Idle hours should grow across the readings
        assert idles[-1] > idles[0], f"Idle hours not growing: {idles}"


class TestAbnormalFuel:
    def test_fuel_consumption_elevated(self, client):
        resp = client.post(
            "/assets/EQX1001/simulate",
            json={"scenario": "abnormal_fuel", "readings": 8},
        )
        lphs = [r["fuel_consumption_lph"] for r in resp.json() if r["fuel_consumption_lph"]]
        assert any(lph > 24.0 for lph in lphs), f"No elevated fuel reading: {lphs}"


class TestTelemetryEndpoint:
    def test_get_telemetry_returns_list(self, client):
        # Seed some data
        client.post("/assets/EQX1001/simulate", json={"scenario": "normal", "readings": 5})
        resp = client.get("/assets/EQX1001/telemetry")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_telemetry_scenario_filter(self, client):
        client.post("/assets/EQX1001/simulate", json={"scenario": "normal", "readings": 3})
        client.post("/assets/EQX1001/simulate", json={"scenario": "engine_overheat", "readings": 3})

        resp = client.get("/assets/EQX1001/telemetry?scenario=normal&limit=10")
        for row in resp.json():
            assert row["scenario"] == "normal"
