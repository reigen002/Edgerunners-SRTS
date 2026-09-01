"""
Recommendations router.

GET /recommendations — produce actionable, human-readable recommendations
                       for every asset showing anomalies.

Each recommendation follows the agreed shape:
  {
    asset: str,
    issue: str,
    severity: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
    evidence: str,
    recommendation: str   ← actionable, not just "anomaly detected"
  }
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Asset
from app.schemas import RecommendationOut
from app.utilization import calculate_utilization

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


# ---------------------------------------------------------------------------
# Rule-based recommendation engine
# ---------------------------------------------------------------------------

PRODUCTIVE_RATIO_CRITICAL = 5.0     # %
PRODUCTIVE_RATIO_LOW = 25.0         # %
SHIFT_UTIL_LOW = 30.0               # %


def _build_recommendations(assets: list[Asset]) -> list[RecommendationOut]:
    recs: list[RecommendationOut] = []

    for asset in assets:
        util = calculate_utilization(
            asset.engine_hrs_per_day,
            asset.idle_hrs_per_day,
            asset.operating_days,
        )

        # ── Issue 1: No site assigned ─────────────────────────────────────
        if asset.site_id is None:
            recs.append(RecommendationOut(
                asset=asset.id,
                issue="No site assigned",
                severity="HIGH",
                evidence=(
                    f"{asset.equipment_type} has no registered deployment site. "
                    f"Cannot confirm asset location, compliance, or utilization."
                ),
                recommendation=(
                    "Verify the asset's physical location immediately. "
                    "Assign a site in the system or initiate a site audit. "
                    "If the asset is stranded/idle, consider reallocation to a site "
                    "with documented demand."
                ),
            ))

        # ── Issue 2: No operator assigned ────────────────────────────────
        if asset.operator_id is None:
            recs.append(RecommendationOut(
                asset=asset.id,
                issue="No operator assigned",
                severity="HIGH",
                evidence=(
                    f"{asset.equipment_type} has no operator on record. "
                    f"Untracked operation is a safety and liability risk."
                ),
                recommendation=(
                    "Assign a licensed operator before any operation resumes. "
                    "If the asset is idle, escalate to fleet manager to determine "
                    "whether it should be returned to the dealership or reallocated."
                ),
            ))

        # ── Issue 3: Zero productive use / high idle ──────────────────────
        if util.productive_ratio_pct == 0 and util.idle_hrs_total > 0:
            recs.append(RecommendationOut(
                asset=asset.id,
                issue="Underutilized / unassigned",
                severity="HIGH",
                evidence=(
                    f"{util.idle_hrs_total:.0f}h cumulative idle time recorded "
                    f"over {asset.operating_days} days with zero engine hours. "
                    f"Asset is powered on but not working."
                ),
                recommendation=(
                    "Review rental requirement and consider reallocating the asset. "
                    "If there is no active work order, return the asset to the dealership "
                    "to avoid unnecessary rental cost and wear."
                ),
            ))

        # ── Issue 4: Low productive ratio (but some engine use) ───────────
        elif 0 < util.productive_ratio_pct < PRODUCTIVE_RATIO_LOW:
            recs.append(RecommendationOut(
                asset=asset.id,
                issue=f"Low productive utilization ({util.productive_ratio_pct}%)",
                severity="MEDIUM",
                evidence=util.label,
                recommendation=(
                    f"Investigate cause of high idle time. "
                    f"Consider driver coaching, shift scheduling review, "
                    f"or redeployment to a busier site."
                ),
            ))

        # ── Issue 5: Low shift utilization ────────────────────────────────
        if 0 < util.shift_utilization_pct < SHIFT_UTIL_LOW and util.productive_ratio_pct >= PRODUCTIVE_RATIO_LOW:
            recs.append(RecommendationOut(
                asset=asset.id,
                issue=f"Low shift utilization ({util.shift_utilization_pct}%)",
                severity="MEDIUM",
                evidence=util.label,
                recommendation=(
                    "Consider consolidating work to fewer assets and returning "
                    "underused equipment to the dealership, or reallocating to "
                    "a site with higher demand."
                ),
            ))

    # Sort: CRITICAL → HIGH → MEDIUM → LOW
    severity_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    recs.sort(key=lambda r: severity_order.get(r.severity, 99))
    return recs


@router.get("", response_model=list[RecommendationOut])
def get_recommendations(db: Session = Depends(get_db)):
    """
    Return actionable recommendations for every asset with detected issues.
    Results are ordered by severity (CRITICAL → LOW).
    """
    assets = db.query(Asset).order_by(Asset.id).all()
    return _build_recommendations(assets)
