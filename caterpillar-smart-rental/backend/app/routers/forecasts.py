"""
Forecasts router.

GET /forecasts — demand forecasting by equipment type (optionally filtered by site).

Approach: simple historical moving-average with trend projection.
No ML library required.  This is transparent, explainable, and easy to demo.

Output per equipment type:
  history      — monthly asset-days actually recorded (from seed data)
  forecast     — 3-month projected demand
  expected_returning — assets currently checked out with known return dates
  recommended_allocation — fleet size suggestion for the next period
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from collections import defaultdict

from app.database import get_db
from app.models import Asset
from app.schemas import ExpectedReturn, ForecastDataPoint, ForecastOut

router = APIRouter(prefix="/forecasts", tags=["Forecasts"])


# ---------------------------------------------------------------------------
# Historical demand builder
# ---------------------------------------------------------------------------

def _build_history(assets: list[Asset]) -> dict[str, dict[str, float]]:
    """
    Compute asset-days per month per equipment type from the seed dataset.

    asset-days = operating_days (how long the asset was deployed in that rental)
    grouped into the rental's checkout month as the billing period.

    Returns: { equipment_type: { "YYYY-MM": asset_days, ... }, ... }
    """
    history: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

    for asset in assets:
        if asset.checkout_date:
            period = asset.checkout_date.strftime("%Y-%m")
        else:
            period = "2025-01"  # fallback for assets without checkout date

        history[asset.equipment_type][period] += asset.operating_days

    return history


def _moving_avg(values: list[float], window: int = 3) -> float:
    """Simple trailing moving average of up to `window` most-recent values."""
    tail = values[-window:] if len(values) >= window else values
    return round(sum(tail) / len(tail), 1) if tail else 0.0


def _trend(values: list[float]) -> float:
    """Average period-over-period change (positive = growing demand)."""
    if len(values) < 2:
        return 0.0
    deltas = [values[i] - values[i - 1] for i in range(1, len(values))]
    return round(sum(deltas) / len(deltas), 2)


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.get("", response_model=list[ForecastOut])
def get_forecasts(
    equipment_type: Optional[str] = Query(None, description="Filter by equipment type"),
    site_id: Optional[str] = Query(None, description="Filter by site (informational)"),
    db: Session = Depends(get_db),
):
    """
    Return demand forecasts for each equipment type.

    Methodology
    -----------
    Historical asset-days are computed from the rental dataset.
    A 3-period moving average is applied to the sorted monthly history,
    with a linear trend component added to the 3-month forward projection.
    Recommended allocation = ceil(max(forecast demand) / 30).
    """
    q = db.query(Asset)
    if equipment_type:
        q = q.filter(Asset.equipment_type.ilike(f"%{equipment_type}%"))
    if site_id:
        q = q.filter(Asset.site_id == site_id)

    assets = q.all()
    history_map = _build_history(assets)

    # ── expected returning assets ─────────────────────────────────────────
    returning_map: dict[str, list[ExpectedReturn]] = defaultdict(list)
    for asset in assets:
        if asset.status == "checked_out" and asset.expected_return_date:
            returning_map[asset.equipment_type].append(
                ExpectedReturn(
                    asset_id=asset.id,
                    equipment_type=asset.equipment_type,
                    expected_return_date=asset.expected_return_date,
                )
            )

    results: list[ForecastOut] = []

    for eq_type, period_map in history_map.items():
        sorted_periods = sorted(period_map.keys())
        hist_values = [period_map[p] for p in sorted_periods]

        # Build history DataPoints
        hist_points: list[ForecastDataPoint] = [
            ForecastDataPoint(period=p, demand=period_map[p], is_forecast=False)
            for p in sorted_periods
        ]

        # Simple projection for next 3 months
        avg = _moving_avg(hist_values)
        trend_delta = _trend(hist_values)
        forecast_points: list[ForecastDataPoint] = []

        # Generate 3 forward periods (months) after the last historical period
        from datetime import datetime
        if sorted_periods:
            last_year, last_month = map(int, sorted_periods[-1].split("-"))
        else:
            last_year, last_month = 2025, 5

        for step in range(1, 4):
            m = (last_month - 1 + step) % 12 + 1
            y = last_year + (last_month - 1 + step) // 12
            label = f"{y:04d}-{m:02d}"
            projected = max(0.0, round(avg + trend_delta * step, 1))
            forecast_points.append(
                ForecastDataPoint(period=label, demand=projected, is_forecast=True)
            )

        # Recommended allocation: assets needed to cover peak forecast demand
        # assuming each asset can cover 30 active days per month
        import math
        peak_forecast = max((p.demand for p in forecast_points), default=0)
        peak_hist = max(hist_values, default=0)
        peak = max(peak_forecast, peak_hist)
        recommended = math.ceil(peak / 30) if peak > 0 else 1

        # Build rationale
        if trend_delta > 0:
            trend_txt = f"demand is trending up (+{trend_delta:.1f} days/month)"
        elif trend_delta < 0:
            trend_txt = f"demand is trending down ({trend_delta:.1f} days/month)"
        else:
            trend_txt = "demand is flat"

        rationale = (
            f"3-month moving average: {avg} asset-days/month. "
            f"Trend: {trend_txt}. "
            f"Recommended fleet of {recommended} unit(s) covers peak projected demand "
            f"of {peak:.0f} asset-days assuming 30 active days/unit/month."
        )

        results.append(ForecastOut(
            equipment_type=eq_type,
            site_id=site_id,
            history=hist_points,
            forecast=forecast_points,
            expected_returning=returning_map.get(eq_type, []),
            recommended_allocation=recommended,
            allocation_rationale=rationale,
        ))

    results.sort(key=lambda r: r.equipment_type)
    return results
