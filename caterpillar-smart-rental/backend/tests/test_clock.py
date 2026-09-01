"""
test_clock.py — DEMO_NOW determinism and overdue detection.
"""
import os
from datetime import date, datetime, timezone

import pytest
from app.clock import DEMO_NOW_DEFAULT, get_demo_date, get_demo_now


class TestDemoDate:
    def test_default_is_2025_05_12(self):
        # Environment must be clean (no override set)
        os.environ.pop("SRTS_DEMO_DATE", None)
        d = get_demo_date()
        assert d == date(2025, 5, 12)

    def test_env_override(self):
        os.environ["SRTS_DEMO_DATE"] = "2025-06-01"
        try:
            d = get_demo_date()
            assert d == date(2025, 6, 1)
        finally:
            del os.environ["SRTS_DEMO_DATE"]

    def test_get_demo_now_is_utc_midnight(self):
        os.environ.pop("SRTS_DEMO_DATE", None)
        now = get_demo_now()
        assert now.tzinfo == timezone.utc
        assert now.date() == DEMO_NOW_DEFAULT
        assert now.hour == 0 and now.minute == 0 and now.second == 0


class TestOverdueDetection:
    def test_overdue_alert_generated_for_past_return_date(self, client):
        # EQX1004 expected_return_date = 2025-05-15, DEMO_NOW = 2025-05-12 → NOT overdue
        resp = client.get("/alerts?asset_id=EQX1004&alert_type=overdue")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_overdue_asset_gets_alert(self, client, db_session):
        """
        Force EQX1004 return date to be before DEMO_NOW (2025-05-12)
        and confirm an overdue alert appears after refresh.
        """
        from app.models import Asset
        from app.routers.alerts import refresh_alerts

        a = db_session.get(Asset, "EQX1004")
        a.status = "checked_out"
        a.expected_return_date = datetime(2025, 5, 1, tzinfo=timezone.utc)
        db_session.commit()
        refresh_alerts(db_session)

        resp = client.get("/alerts?asset_id=EQX1004&alert_type=overdue")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["alert_type"] == "overdue"
        assert data[0]["severity"] == "CRITICAL"
