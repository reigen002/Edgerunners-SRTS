"""
test_forecasts.py — forecast response shape and recommended allocation.
"""
import pytest


class TestForecastShape:
    def test_forecasts_returns_list(self, client):
        resp = client.get("/forecasts")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_each_forecast_has_required_fields(self, client):
        resp = client.get("/forecasts")
        data = resp.json()
        assert len(data) > 0
        for item in data:
            assert "equipment_type" in item
            assert "history" in item
            assert "forecast" in item
            assert "expected_returning" in item
            assert "recommended_allocation" in item
            assert "allocation_rationale" in item

    def test_forecast_has_3_future_periods(self, client):
        resp = client.get("/forecasts")
        for item in resp.json():
            forecast_points = item["forecast"]
            assert len(forecast_points) == 3, (
                f"Expected 3 forecast periods for {item['equipment_type']}, "
                f"got {len(forecast_points)}"
            )
            for p in forecast_points:
                assert p["is_forecast"] is True

    def test_history_points_are_not_forecast(self, client):
        resp = client.get("/forecasts")
        for item in resp.json():
            for p in item["history"]:
                assert p["is_forecast"] is False

    def test_recommended_allocation_is_positive_int(self, client):
        resp = client.get("/forecasts")
        for item in resp.json():
            alloc = item["recommended_allocation"]
            assert isinstance(alloc, int)
            assert alloc >= 0

    def test_filter_by_equipment_type(self, client):
        resp = client.get("/forecasts?equipment_type=Excavator")
        assert resp.status_code == 200
        for item in resp.json():
            assert item["equipment_type"] == "Excavator"


class TestRecommendations:
    def test_recommendations_returns_list(self, client):
        resp = client.get("/recommendations")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_each_recommendation_has_required_fields(self, client):
        resp = client.get("/recommendations")
        for rec in resp.json():
            assert "asset" in rec
            assert "issue" in rec
            assert "severity" in rec
            assert "evidence" in rec
            assert "recommendation" in rec

    def test_severity_values_are_valid(self, client):
        valid = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
        resp = client.get("/recommendations")
        for rec in resp.json():
            assert rec["severity"] in valid

    def test_eqx1002_has_exactly_one_recommendation(self, client):
        """Correlated conditions must be consolidated per asset."""
        resp = client.get("/recommendations")
        eqx1002_recs = [r for r in resp.json() if r["asset"] == "EQX1002"]
        assert len(eqx1002_recs) == 1, (
            f"EQX1002 should have exactly 1 consolidated recommendation, "
            f"got {len(eqx1002_recs)}: {[r['issue'] for r in eqx1002_recs]}"
        )

    def test_eqx1002_recommendation_is_high_severity(self, client):
        resp = client.get("/recommendations")
        rec = next(r for r in resp.json() if r["asset"] == "EQX1002")
        assert rec["severity"] == "HIGH"

    def test_recommendations_sorted_by_severity(self, client):
        order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
        resp = client.get("/recommendations")
        recs = resp.json()
        for i in range(len(recs) - 1):
            assert order[recs[i]["severity"]] <= order[recs[i + 1]["severity"]], (
                f"Recommendations not sorted: {recs[i]['severity']} before {recs[i+1]['severity']}"
            )
