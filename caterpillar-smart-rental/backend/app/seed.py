"""
Seed data — the official dataset from the hackathon spec.
Run via: POST /admin/seed  or automatically on first startup.

NULL site/operator values are intentional anomalies and preserved exactly.
"""
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import Alert, Asset, Site, Operator, RentalEvent, Telemetry


SITES = [
    {"id": "S001", "name": "North Construction Zone",   "latitude": 14.5995, "longitude": 120.9842, "address": "Quezon City"},
    {"id": "S002", "name": "South Mining Site",          "latitude": 14.4422, "longitude": 121.0394, "address": "Taguig"},
    {"id": "S003", "name": "East Infrastructure Hub",   "latitude": 14.6760, "longitude": 121.0437, "address": "Marikina"},
    {"id": "S004", "name": "West Roadworks Depot",      "latitude": 14.5547, "longitude": 120.9830, "address": "Pasay"},
    {"id": "S006", "name": "Central Earthworks Base",   "latitude": 14.5995, "longitude": 121.0244, "address": "Mandaluyong"},
]

OPERATORS = [
    {"id": "OP101", "name": "Juan dela Cruz",    "license_class": "Heavy",  "contact": "+63-917-0001"},
    {"id": "OP203", "name": "Maria Santos",      "license_class": "Heavy",  "contact": "+63-918-0002"},
    {"id": "OP106", "name": "Pedro Reyes",       "license_class": "Medium", "contact": "+63-919-0003"},
    {"id": "OP301", "name": "Ana Gomez",         "license_class": "Heavy",  "contact": "+63-920-0004"},
    {"id": "OP114", "name": "Carlos Mendoza",    "license_class": "Medium", "contact": "+63-921-0005"},
]

# Official seed data — do not alter the NULL site/operator values
ASSETS = [
    {
        "id": "EQX1001", "equipment_type": "Excavator",
        "site_id": "S003", "operator_id": "OP101",
        "checkout_date": datetime(2025, 4, 1,  tzinfo=timezone.utc),
        "expected_return_date": datetime(2025, 4, 16, tzinfo=timezone.utc),
        "engine_hrs_per_day": 1.5, "idle_hrs_per_day": 10.0, "operating_days": 15,
        "status": "available", "customer_name": "ABC Construction",
        "qr_code": "QR-EQX1001", "rfid_tag": "RFID-EQX1001",
    },
    {
        "id": "EQX1002", "equipment_type": "Cater",
        "site_id": None,           "operator_id": None,       # intentional anomaly
        "checkout_date": datetime(2025, 3, 1,  tzinfo=timezone.utc),
        "expected_return_date": datetime(2025, 3, 30, tzinfo=timezone.utc),
        "engine_hrs_per_day": 0.0, "idle_hrs_per_day": 11.0, "operating_days": 20,
        "status": "checked_out", "customer_name": None,
        "qr_code": "QR-EQX1002", "rfid_tag": "RFID-EQX1002",
    },
    {
        "id": "EQX1003", "equipment_type": "Bulldozer",
        "site_id": "S002", "operator_id": "OP203",
        "checkout_date": datetime(2025, 2, 15, tzinfo=timezone.utc),
        "expected_return_date": datetime(2025, 3, 11, tzinfo=timezone.utc),
        "engine_hrs_per_day": 7.5, "idle_hrs_per_day": 0.5,  "operating_days": 25,
        "status": "available", "customer_name": "Delta Mining",
        "qr_code": "QR-EQX1003", "rfid_tag": "RFID-EQX1003",
    },
    {
        "id": "EQX1004", "equipment_type": "Grader",
        "site_id": "S004", "operator_id": "OP106",
        "checkout_date": datetime(2025, 5, 5,  tzinfo=timezone.utc),
        "expected_return_date": datetime(2025, 5, 15, tzinfo=timezone.utc),
        "engine_hrs_per_day": 2.0, "idle_hrs_per_day": 9.0,  "operating_days": 10,
        "status": "checked_out", "customer_name": "Metro Roads Inc",
        "qr_code": "QR-EQX1004", "rfid_tag": "RFID-EQX1004",
    },
    {
        "id": "EQX1005", "equipment_type": "Bulldozer",
        "site_id": "S006", "operator_id": "OP301",
        "checkout_date": datetime(2025, 1, 1,  tzinfo=timezone.utc),
        "expected_return_date": datetime(2025, 1, 31, tzinfo=timezone.utc),
        "engine_hrs_per_day": 8.0, "idle_hrs_per_day": 0.0,  "operating_days": 30,
        "status": "available", "customer_name": "Southworks Ltd",
        "qr_code": "QR-EQX1005", "rfid_tag": "RFID-EQX1005",
    },
    {
        "id": "EQX1006", "equipment_type": "Grader",
        "site_id": "S001", "operator_id": "OP114",
        "checkout_date": datetime(2025, 4, 5,  tzinfo=timezone.utc),
        "expected_return_date": datetime(2025, 4, 23, tzinfo=timezone.utc),
        "engine_hrs_per_day": 3.0, "idle_hrs_per_day": 6.0,  "operating_days": 18,
        "status": "available", "customer_name": "City Contractors",
        "qr_code": "QR-EQX1006", "rfid_tag": "RFID-EQX1006",
    },
    {
        "id": "EQX1007", "equipment_type": "Excavator",
        "site_id": None,           "operator_id": None,       # intentional anomaly
        "checkout_date": datetime(2025, 3, 20, tzinfo=timezone.utc),
        "expected_return_date": datetime(2025, 4, 1,  tzinfo=timezone.utc),
        "engine_hrs_per_day": 0.0, "idle_hrs_per_day": 12.0, "operating_days": 12,
        "status": "checked_out", "customer_name": None,
        "qr_code": "QR-EQX1007", "rfid_tag": "RFID-EQX1007",
    },
]


def seed_database(db: Session) -> dict:
    """
    Insert all reference data if the database is empty.
    Idempotent — safe to call multiple times.
    Returns counts of inserted records.
    """
    counts = {"sites": 0, "operators": 0, "assets": 0}

    for s in SITES:
        if not db.get(Site, s["id"]):
            db.add(Site(**s))
            counts["sites"] += 1

    for o in OPERATORS:
        if not db.get(Operator, o["id"]):
            db.add(Operator(**o))
            counts["operators"] += 1

    db.flush()  # ensure FKs exist before asset insert

    for a in ASSETS:
        if not db.get(Asset, a["id"]):
            db.add(Asset(**a))
            counts["assets"] += 1

    db.commit()
    return counts


def reset_database(db: Session) -> dict:
    """
    Delete all data and re-seed from scratch.
    Called by POST /admin/reset.
    """
    for model in [Alert, Telemetry, RentalEvent, Asset, Operator, Site]:
        db.query(model).delete()
    db.commit()
    return seed_database(db)
