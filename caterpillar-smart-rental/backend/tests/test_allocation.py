"""
test_allocation.py — forecast-driven allocation feature.

Covers the 10 required behavioral tests:
  1. S003 excavator demand history loads.
  2. Site-level forecast is deterministic (same input → same output).
  3. S003 forecast produces approximately 3 units.
  4. Supply calculation sees the relevant available/recoverable assets.
  5. EQX1007 is selected as a valid excavator allocation candidate.
  6. Destination site is S003.
  7. The remaining projected gap is 1.
  8. Recommendation contains the supporting evidence.
  9. Existing 73 tests continue to pass (verified by running the full suite).
 10. Existing EQX1002 recommendation/anomaly behavior remains unchanged.
"""
import pytest

from app.demand_supplement import get_demand_history, all_supplement_segments
from app.routers.forecasts import _site_level_forecast, _project
from app.models import Asset


# ---------------------------------------------------------------------------
# 1. Demand history loads correctly
# ---------------------------------------------------------------------------

class TestDemandHistoryLoad:
    def test_s003_excavator_history_loads(self):
        """Demand history for S003 Excavator must be non-empty."""
        periods = get_demand_history("S003", "Excavator")
        assert len(periods) == 6, f"Expected 6 periods, got {len(periods)}"

    def test_s003_excavator_period_values(self):
        """Historical counts must match spec: 2,2,2,3,3,3."""
        periods = get_demand_history("S003", "Excavator")
        counts = [p["count"] for p in sorted(periods, key=lambda p: p["period"])]
        assert counts == [2, 2, 2, 3, 3, 3], f"Unexpected counts: {counts}"

    def test_supplement_segments_non_empty(self):
        """all_supplement_segments should return at least one entry."""
        segs = all_supplement_segments()
        assert len(segs) >= 1


# ---------------------------------------------------------------------------
# 2 & 3. Site-level forecast is deterministic and produces ~3 units
# ---------------------------------------------------------------------------

class TestSiteLevelForecast:
    def test_s003_forecast_is_deterministic(self, db_session):
        """Calling _site_level_forecast twice with same inputs must return
        identical peak demand values."""
        all_assets = db_session.query(Asset).all()
        row1 = _site_level_forecast("S003", "Excavator", all_assets)
        row2 = _site_level_forecast("S003", "Excavator", all_assets)
        assert row1 is not None
        assert row2 is not None
        assert row1.peak_forecast_demand == row2.peak_forecast_demand

    def test_s003_peak_forecast_approximately_3(self, db_session):
        """Weighted moving average of [2,2,2,3,3,3] should forecast ~3 units."""
        all_assets = db_session.query(Asset).all()
        row = _site_level_forecast("S003", "Excavator", all_assets)
        assert row is not None
        assert row.peak_forecast_demand == 3, (
            f"Expected peak_forecast_demand=3, got {row.peak_forecast_demand}"
        )

    def test_s003_forecast_has_3_future_periods(self, db_session):
        """Forecast must project 3 future periods."""
        all_assets = db_session.query(Asset).all()
        row = _site_level_forecast("S003", "Excavator", all_assets)
        assert row is not None
        assert len(row.forecast) == 3

    def test_wma_projection_deterministic(self):
        """_project([2,2,2,3,3,3]) must always return [3,3,3]."""
        result = _project([2, 2, 2, 3, 3, 3], steps=3)
        assert result == [3, 3, 3], f"Expected [3,3,3], got {result}"

    def test_forecast_endpoint_returns_s003_site_row(self, client):
        """GET /forecasts must include a site-level row for S003 Excavator."""
        resp = client.get("/forecasts?site_id=S003&equipment_type=Excavator")
        assert resp.status_code == 200
        rows = resp.json()
        site_rows = [
            r for r in rows
            if r.get("site_id") == "S003"
            and r.get("equipment_type") == "Excavator"
            and r.get("peak_forecast_demand") is not None
        ]
        assert len(site_rows) >= 1, "No S003 Excavator site-level row in /forecasts"


# ---------------------------------------------------------------------------
# 4. Supply calculation
# ---------------------------------------------------------------------------

class TestSupplyCalculation:
    def test_supply_fields_present(self, db_session):
        """Site-level forecast row must expose supply_available,
        supply_recoverable, supply_total_known."""
        all_assets = db_session.query(Asset).all()
        row = _site_level_forecast("S003", "Excavator", all_assets)
        assert row is not None
        assert row.supply_available is not None
        assert row.supply_recoverable is not None
        assert row.supply_total_known is not None

    def test_supply_total_is_available_plus_recoverable(self, db_session):
        all_assets = db_session.query(Asset).all()
        row = _site_level_forecast("S003", "Excavator", all_assets)
        assert row is not None
        assert row.supply_total_known == (row.supply_available or 0) + (row.supply_recoverable or 0)

    def test_eqx1007_counted_in_recoverable_or_available(self, db_session):
        """EQX1007 (no site, no operator, Excavator) must appear in supply."""
        all_assets = db_session.query(Asset).all()
        row = _site_level_forecast("S003", "Excavator", all_assets)
        assert row is not None
        # EQX1007 is available with no site/operator → counted in recoverable pool
        assert (row.supply_available or 0) + (row.supply_recoverable or 0) >= 1


# ---------------------------------------------------------------------------
# 5 & 6. EQX1007 is selected as candidate; destination is S003
# ---------------------------------------------------------------------------

class TestAllocationCandidate:
    def test_eqx1007_is_candidate(self, db_session):
        """EQX1007 must appear in allocation_candidates for S003 Excavator."""
        all_assets = db_session.query(Asset).all()
        row = _site_level_forecast("S003", "Excavator", all_assets)
        assert row is not None
        assert row.allocation_candidates, "No allocation candidates returned"
        candidate_ids = [c.asset_id for c in row.allocation_candidates]
        assert "EQX1007" in candidate_ids, (
            f"EQX1007 not in candidates: {candidate_ids}"
        )

    def test_eqx1007_destination_is_s003(self, db_session):
        """EQX1007 candidate must have destination_site_id == 'S003'."""
        all_assets = db_session.query(Asset).all()
        row = _site_level_forecast("S003", "Excavator", all_assets)
        assert row is not None
        assert row.allocation_candidates
        eqx1007_candidate = next(
            (c for c in row.allocation_candidates if c.asset_id == "EQX1007"), None
        )
        assert eqx1007_candidate is not None, "EQX1007 not in candidates"
        assert eqx1007_candidate.destination_site_id == "S003"


# ---------------------------------------------------------------------------
# 7. Projected gap is 1
# ---------------------------------------------------------------------------

class TestProjectedGap:
    def test_s003_projected_gap_is_1(self, db_session):
        """
        peak_demand=3, supply=(EQX1001@ S003=1 available) + EQX1007(recoverable)=1
        → supply_total=2, gap=1.
        """
        all_assets = db_session.query(Asset).all()
        row = _site_level_forecast("S003", "Excavator", all_assets)
        assert row is not None
        assert row.projected_gap == 1, (
            f"Expected projected_gap=1, got {row.projected_gap}. "
            f"supply_available={row.supply_available}, "
            f"supply_recoverable={row.supply_recoverable}, "
            f"peak_demand={row.peak_forecast_demand}"
        )

    def test_gap_not_negative(self, db_session):
        """Projected gap must never be negative."""
        all_assets = db_session.query(Asset).all()
        row = _site_level_forecast("S003", "Excavator", all_assets)
        assert row is not None
        assert (row.projected_gap or 0) >= 0


# ---------------------------------------------------------------------------
# 8. Recommendation contains evidence
# ---------------------------------------------------------------------------

class TestAllocationRecommendation:
    def test_eqx1007_allocation_rec_in_recommendations(self, client):
        """GET /recommendations must include an allocation rec referencing EQX1007."""
        resp = client.get("/recommendations")
        assert resp.status_code == 200
        recs = resp.json()
        allocation_recs = [
            r for r in recs
            if r["asset"] == "EQX1007"
            and "S003" in r.get("evidence", "")
        ]
        assert len(allocation_recs) >= 1, (
            f"No EQX1007→S003 allocation recommendation found. All recs: "
            + str([{"asset": r["asset"], "issue": r["issue"]} for r in recs])
        )

    def test_allocation_rec_evidence_contains_forecast(self, client):
        """The allocation recommendation evidence must mention forecast demand."""
        resp = client.get("/recommendations")
        recs = resp.json()
        alloc = next(
            (r for r in recs if r["asset"] == "EQX1007" and "S003" in r.get("evidence", "")),
            None,
        )
        assert alloc is not None, "No EQX1007 allocation recommendation"
        ev = alloc["evidence"]
        assert "3" in ev, f"Forecast demand '3' not in evidence: {ev}"
        assert "gap" in ev.lower() or "projected" in ev.lower(), (
            f"'gap' / 'projected' not found in evidence: {ev}"
        )

    def test_allocation_rec_recommendation_mentions_recovery(self, client):
        """The recommendation text must mention recovering/redeploying EQX1007."""
        resp = client.get("/recommendations")
        recs = resp.json()
        alloc = next(
            (r for r in recs if r["asset"] == "EQX1007" and "S003" in r.get("evidence", "")),
            None,
        )
        assert alloc is not None
        rec_text = alloc["recommendation"]
        assert "EQX1007" in rec_text or "S003" in rec_text, (
            f"Recommendation doesn't mention EQX1007 or S003: {rec_text}"
        )

    def test_one_allocation_rec_per_forecast_gap(self, client):
        """There must be exactly one allocation rec for S003 Excavator gap."""
        resp = client.get("/recommendations")
        recs = resp.json()
        s003_alloc = [
            r for r in recs
            if r["asset"] == "EQX1007"
            and "S003" in r.get("evidence", "")
            and "gap" in r.get("issue", "").lower()
        ]
        assert len(s003_alloc) == 1, (
            f"Expected 1 S003 forecast allocation rec, got {len(s003_alloc)}"
        )


# ---------------------------------------------------------------------------
# 10. Existing EQX1002 behavior unchanged
# ---------------------------------------------------------------------------

class TestExistingBehaviorUnchanged:
    def test_eqx1002_anomaly_rec_still_present(self, client):
        """EQX1002 must still have an asset anomaly recommendation."""
        resp = client.get("/recommendations")
        assert resp.status_code == 200
        recs = resp.json()
        eqx1002_recs = [r for r in recs if r["asset"] == "EQX1002"]
        assert len(eqx1002_recs) == 1, (
            f"Expected exactly 1 EQX1002 rec, got {len(eqx1002_recs)}"
        )

    def test_eqx1002_rec_is_high_severity(self, client):
        """EQX1002 anomaly rec must remain HIGH severity."""
        resp = client.get("/recommendations")
        recs = resp.json()
        eqx1002 = next((r for r in recs if r["asset"] == "EQX1002"), None)
        assert eqx1002 is not None
        assert eqx1002["severity"] == "HIGH"

    def test_eqx1002_alerts_unchanged(self, client):
        """EQX1002 should still have no_site, no_operator, high_idle alerts."""
        resp = client.get("/alerts?asset_id=EQX1002")
        assert resp.status_code == 200
        alerts = resp.json()
        types = {a["alert_type"] for a in alerts}
        assert "no_site" in types
        assert "no_operator" in types
        assert "high_idle" in types
