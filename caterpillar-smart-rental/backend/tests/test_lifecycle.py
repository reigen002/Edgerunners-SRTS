"""
test_lifecycle.py — checkout → events → checkin → events lifecycle.
"""
import pytest
from datetime import datetime, timezone


class TestCheckout:
    def test_checkout_available_asset(self, client):
        payload = {
            "operator_id": "OP101",
            "site_id": "S003",
            "customer_name": "Test Co",
            "expected_return_date": "2025-05-20T00:00:00Z",
            "notes": "Test checkout",
            "performed_by": "Agent A",
            "identifier_method": "qr",
        }
        resp = client.post("/assets/EQX1001/checkout", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["event_type"] == "checkout"
        assert data["asset_id"] == "EQX1001"

    def test_checkout_updates_asset_status(self, client):
        payload = {
            "operator_id": "OP203",
            "site_id": "S002",
            "customer_name": "Test Co",
            "expected_return_date": "2025-05-20T00:00:00Z",
        }
        client.post("/assets/EQX1003/checkout", json=payload)
        resp = client.get("/assets/EQX1003")
        assert resp.json()["status"] == "checked_out"

    def test_double_checkout_returns_409(self, client):
        payload = {
            "operator_id": "OP101",
            "site_id": "S003",
            "customer_name": "Test Co",
            "expected_return_date": "2025-05-20T00:00:00Z",
        }
        client.post("/assets/EQX1001/checkout", json=payload)
        resp2 = client.post("/assets/EQX1001/checkout", json=payload)
        assert resp2.status_code == 409

    def test_checkout_nonexistent_asset_returns_404(self, client):
        payload = {"operator_id": "OP101", "site_id": "S001", "expected_return_date": "2025-05-20T00:00:00Z"}
        resp = client.post("/assets/EQX9999/checkout", json=payload)
        assert resp.status_code == 404


class TestCheckin:
    def _checkout(self, client, asset_id="EQX1001"):
        payload = {
            "operator_id": "OP101",
            "site_id": "S003",
            "customer_name": "Test Co",
            "expected_return_date": "2025-05-20T00:00:00Z",
        }
        client.post(f"/assets/{asset_id}/checkout", json=payload)

    def test_checkin_after_checkout(self, client):
        self._checkout(client)
        resp = client.post("/assets/EQX1001/checkin", json={"notes": "Good condition"})
        assert resp.status_code == 200
        assert resp.json()["event_type"] == "checkin"

    def test_checkin_clears_operator_and_site(self, client):
        self._checkout(client)
        client.post("/assets/EQX1001/checkin", json={})
        resp = client.get("/assets/EQX1001")
        data = resp.json()
        assert data["status"] == "available"
        assert data["operator_id"] is None
        assert data["site_id"] is None

    def test_checkin_without_checkout_returns_409(self, client):
        # EQX1001 starts as "available" in seed
        resp = client.post("/assets/EQX1001/checkin", json={})
        assert resp.status_code == 409

    def test_double_checkin_returns_409(self, client):
        self._checkout(client)
        client.post("/assets/EQX1001/checkin", json={})
        resp2 = client.post("/assets/EQX1001/checkin", json={})
        assert resp2.status_code == 409


class TestEvents:
    def test_events_recorded_for_checkout_and_checkin(self, client):
        payload = {
            "operator_id": "OP101",
            "site_id": "S003",
            "expected_return_date": "2025-05-20T00:00:00Z",
        }
        client.post("/assets/EQX1001/checkout", json=payload)
        client.post("/assets/EQX1001/checkin", json={})

        resp = client.get("/assets/EQX1001/events")
        events = resp.json()
        types = [e["event_type"] for e in events]
        assert "checkout" in types
        assert "checkin" in types

    def test_events_ordered_newest_first(self, client):
        payload = {
            "operator_id": "OP101",
            "site_id": "S003",
            "expected_return_date": "2025-05-20T00:00:00Z",
        }
        client.post("/assets/EQX1001/checkout", json=payload)
        client.post("/assets/EQX1001/checkin", json={})

        resp = client.get("/assets/EQX1001/events")
        events = resp.json()
        # Newest first — checkin should appear before checkout
        assert events[0]["event_type"] == "checkin"
