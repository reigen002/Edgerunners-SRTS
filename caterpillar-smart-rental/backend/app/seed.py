"""
Seed data — the official dataset from the hackathon spec.
Run via: POST /admin/seed  or automatically on first startup.

NULL site/operator values are intentional anomalies and preserved exactly.
Asset data is loaded from data/seed/official_assets.csv so the spec's
official dataset lives in exactly one place.
"""
import csv
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from app.models import Alert, Asset, Site, Operator, RentalEvent, Telemetry

_ASSETS_CSV = Path(__file__).resolve().parents[2] / "data" / "seed" / "official_assets.csv"


def _load_assets() -> list[dict]:
    with open(_ASSETS_CSV, newline="") as f:
        rows = list(csv.DictReader(f))

    assets = []
    for row in rows:
        assets.append({
            "id": row["id"],
            "equipment_type": row["equipment_type"],
            "site_id": row["site_id"] or None,
            "operator_id": row["operator_id"] or None,
            "checkout_date": datetime.fromisoformat(row["checkout_date"].replace("Z", "+00:00")),
            "expected_return_date": datetime.fromisoformat(row["expected_return_date"].replace("Z", "+00:00")),
            "engine_hrs_per_day": float(row["engine_hrs_per_day"]),
            "idle_hrs_per_day": float(row["idle_hrs_per_day"]),
            "operating_days": int(row["operating_days"]),
            "status": row["status"],
            "customer_name": row["customer_name"] or None,
            "qr_code": row["qr_code"],
            "rfid_tag": row["rfid_tag"],
        })
    return assets


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

# Snapshot for import-time inspection (e.g. tests). seed_database() and
# _seed_lifecycle_events() call _load_assets() fresh each time so
# POST /admin/reset always reflects the current CSV on disk.
ASSETS = _load_assets()


def _seed_lifecycle_events(db: Session) -> None:
    """
    Generate CHECKOUT/CHECKIN/OVERDUE_FLAG events from each asset's official
    checkout/return dates, so the lifecycle timeline isn't empty until a live
    checkout/checkin happens. Skips any asset that already has events (e.g.
    one already mutated by a live checkout/checkin) to stay idempotent.
    """
    from app.clock import get_demo_now
    demo_now = get_demo_now()

    for a in _load_assets():
        asset_id = a["id"]
        if db.query(RentalEvent).filter(RentalEvent.asset_id == asset_id).first():
            continue

        checkout_date = a["checkout_date"]
        return_date = a["expected_return_date"]

        if checkout_date:
            db.add(RentalEvent(
                asset_id=asset_id, event_type="checkout", timestamp=checkout_date,
                operator_id=a.get("operator_id"), site_id=a.get("site_id"),
                customer_name=a.get("customer_name"), expected_return_date=return_date,
                performed_by="Dealer Desk", identifier_method="manual",
            ))

        if a["status"] == "available" and return_date:
            db.add(RentalEvent(
                asset_id=asset_id, event_type="checkin", timestamp=return_date,
                performed_by="Dealer Desk", identifier_method="manual",
            ))
        elif a["status"] == "checked_out" and return_date and return_date < demo_now:
            db.add(RentalEvent(
                asset_id=asset_id, event_type="overdue_flagged", timestamp=return_date,
                expected_return_date=return_date, performed_by="System",
            ))

    db.commit()


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

    for a in _load_assets():
        if not db.get(Asset, a["id"]):
            db.add(Asset(**a))
            counts["assets"] += 1

    db.commit()
    _seed_lifecycle_events(db)
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
