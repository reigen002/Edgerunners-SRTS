"""
Alerts router.

GET /alerts              — list all active alerts (optionally filter)
GET /alerts/{alert_id}   — single alert detail
POST /alerts/refresh     — re-run anomaly logic and regenerate alerts from current data
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert, Asset, Telemetry
from app.schemas import AlertOut
from app.utilization import calculate_utilization
from app.clock import get_demo_now

router = APIRouter(prefix="/alerts", tags=["Alerts"])


# ---------------------------------------------------------------------------
# Anomaly detection logic
# ---------------------------------------------------------------------------
# Thresholds are explicit constants so they're easy to tune and explain.

OVERHEAT_THRESHOLD_C = 110.0
PRODUCTIVE_RATIO_LOW_THRESHOLD = 10.0   # % — below this is "high idle"
SHIFT_UTILIZATION_LOW_THRESHOLD = 30.0  # % — below this is "low utilization"
FUEL_SPIKE_MULTIPLIER = 2.0             # × baseline LPH


def _generate_alerts_for_asset(db: Session, asset: Asset) -> list[Alert]:
    """Return new Alert objects (not yet committed) for anomalies found in asset."""
    new_alerts: list[Alert] = []

    def make_alert(alert_type, severity, message, evidence=""):
        return Alert(
            asset_id=asset.id,
            alert_type=alert_type,
            severity=severity,
            message=message,
            evidence=evidence,
            resolved=False,
        )

    # --- Dataset-visible anomalies (spec-mandated) ---

    # Only anomalous while actively rented — a returned/available asset has no
    # active site/operator by definition and that isn't a problem to flag.
    if asset.site_id is None and asset.status == "checked_out":
        new_alerts.append(
            make_alert(
                "no_site", "HIGH",
                f"Asset {asset.id} has no assigned site.",
                "site_id is NULL — asset cannot be located or dispatched.",
            )
        )

    if asset.operator_id is None and asset.status == "checked_out":
        new_alerts.append(
            make_alert(
                "no_operator", "HIGH",
                f"Asset {asset.id} has no assigned operator.",
                "operator_id is NULL — asset may be operating unsupervised.",
            )
        )

    # Utilization-based alerts
    util = calculate_utilization(
        asset.engine_hrs_per_day,
        asset.idle_hrs_per_day,
        asset.operating_days,
    )

    if util.productive_ratio_pct == 0 and util.idle_hrs_total > 0:
        new_alerts.append(
            make_alert(
                "high_idle", "HIGH",
                f"Asset {asset.id} shows zero productive engine use with "
                f"{util.idle_hrs_total:.0f}h cumulative idle time.",
                f"engine_hrs_per_day={asset.engine_hrs_per_day}, "
                f"idle_hrs_per_day={asset.idle_hrs_per_day}, "
                f"operating_days={asset.operating_days}. "
                f"Likely stationary / unassigned.",
            )
        )
    elif util.productive_ratio_pct < PRODUCTIVE_RATIO_LOW_THRESHOLD:
        new_alerts.append(
            make_alert(
                "high_idle", "MEDIUM",
                f"Asset {asset.id} productive ratio only {util.productive_ratio_pct}%.",
                util.label,
            )
        )

    if 0 < util.shift_utilization_pct < SHIFT_UTILIZATION_LOW_THRESHOLD:
        new_alerts.append(
            make_alert(
                "low_utilization", "MEDIUM",
                f"Asset {asset.id} shift utilization is low at {util.shift_utilization_pct}%.",
                util.label,
            )
        )

    # Overdue check — normalize expected_return_date to UTC for comparison
    # (SQLite stores datetimes offset-naive; we treat them as UTC)
    if (
        asset.status == "checked_out"
        and asset.expected_return_date
    ):
        _ret = asset.expected_return_date
        if _ret.tzinfo is None:
            from datetime import timezone as _tz
            _ret = _ret.replace(tzinfo=_tz.utc)
        _is_overdue = _ret < get_demo_now()
    else:
        _is_overdue = False
    if _is_overdue:
        new_alerts.append(
            make_alert(
                "overdue", "CRITICAL",
                f"Asset {asset.id} is overdue for return.",
                f"Expected return: {asset.expected_return_date.isoformat()}",
            )
        )

    # --- Telemetry-based alerts (most recent readings) ---
    recent = (
        db.query(Telemetry)
        .filter(Telemetry.asset_id == asset.id)
        .order_by(Telemetry.timestamp.desc())
        .limit(20)
        .all()
    )

    for reading in recent:
        if reading.engine_temp_c and reading.engine_temp_c >= OVERHEAT_THRESHOLD_C:
            new_alerts.append(
                make_alert(
                    "engine_overheat", "CRITICAL",
                    f"Asset {asset.id} engine temperature {reading.engine_temp_c:.1f}°C — overheating.",
                    f"Timestamp: {reading.timestamp.isoformat()}, fault: {reading.fault_code}",
                )
            )
            break  # one alert per asset

        if reading.seatbelt_on is False:
            new_alerts.append(
                make_alert(
                    "seatbelt_violation", "HIGH",
                    f"Asset {asset.id} operator seatbelt not fastened.",
                    f"Timestamp: {reading.timestamp.isoformat()}",
                )
            )
            break

        if (
            reading.fuel_consumption_lph
            and reading.fuel_consumption_lph > 12.0 * FUEL_SPIKE_MULTIPLIER
        ):
            new_alerts.append(
                make_alert(
                    "abnormal_fuel", "MEDIUM",
                    f"Asset {asset.id} fuel consumption {reading.fuel_consumption_lph:.1f} L/h "
                    f"— abnormally high.",
                    f"Baseline ~12 L/h. Timestamp: {reading.timestamp.isoformat()}",
                )
            )
            break

        if reading.fault_code and reading.fault_code.startswith("L"):
            new_alerts.append(
                make_alert(
                    "location_mismatch", "HIGH",
                    f"Asset {asset.id} outside registered site boundary.",
                    reading.fault_description or reading.fault_code,
                )
            )
            break

    return new_alerts


def refresh_alerts(db: Session) -> list[Alert]:
    """
    Re-generate alerts for all assets.
    Clears existing unresolved alerts and re-evaluates every asset.
    """
    # Remove stale unresolved alerts
    db.query(Alert).filter(Alert.resolved == False).delete()  # noqa: E712
    db.flush()

    assets = db.query(Asset).all()
    all_alerts: list[Alert] = []
    for asset in assets:
        alerts = _generate_alerts_for_asset(db, asset)
        for a in alerts:
            db.add(a)
        all_alerts.extend(alerts)

    db.commit()
    for a in all_alerts:
        db.refresh(a)
    return all_alerts


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=list[AlertOut])
def list_alerts(
    asset_id: Optional[str] = Query(None),
    alert_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    resolved: Optional[bool] = Query(False),
    db: Session = Depends(get_db),
):
    """
    List alerts. By default returns only unresolved alerts.
    Pass resolved=true to include resolved ones.
    """
    q = db.query(Alert)
    if asset_id:
        q = q.filter(Alert.asset_id == asset_id)
    if alert_type:
        q = q.filter(Alert.alert_type == alert_type)
    if severity:
        q = q.filter(Alert.severity == severity)
    if resolved is not None:
        q = q.filter(Alert.resolved == resolved)
    return q.order_by(Alert.created_at.desc()).all()


@router.post("/refresh", response_model=list[AlertOut])
def trigger_alert_refresh(db: Session = Depends(get_db)):
    """Re-run anomaly detection across all assets and return generated alerts."""
    return refresh_alerts(db)
