"""
Recommendations router.

GET /recommendations — produce actionable, human-readable recommendations
                       for every asset showing anomalies.

Each recommendation consolidates ALL conditions detected for an asset into
ONE coherent dealer action — correlated symptoms (no_site + no_operator +
high_idle) are not emitted as separate records.

Shape:
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

_SEVERITY_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}


def _highest(severities: list[str]) -> str:
    if not severities:
        return "LOW"
    return min(severities, key=lambda s: _SEVERITY_ORDER.get(s, 99))


def _build_recommendations(assets: list[Asset]) -> list[RecommendationOut]:
    recs: list[RecommendationOut] = []

    for asset in assets:
        util = calculate_utilization(
            asset.engine_hrs_per_day,
            asset.idle_hrs_per_day,
            asset.operating_days,
        )

        # Collect all detected conditions for this asset
        issues: list[str] = []
        severities: list[str] = []
        evidence_parts: list[str] = []
        rec_parts: list[str] = []

        # ── Condition: No site assigned ───────────────────────────────────
        if asset.site_id is None:
            issues.append("no site assigned")
            severities.append("HIGH")
            evidence_parts.append(
                "no registered deployment site — cannot confirm asset location, "
                "compliance, or utilization"
            )
            rec_parts.append(
                "verify the asset's physical location and assign a site in the system"
            )

        # ── Condition: No operator assigned ──────────────────────────────
        if asset.operator_id is None:
            issues.append("no operator assigned")
            severities.append("HIGH")
            evidence_parts.append(
                "no licensed operator on record — untracked operation is a safety "
                "and liability risk"
            )
            rec_parts.append(
                "assign a licensed operator before any operation resumes"
            )

        # ── Condition: Zero productive use / high idle ────────────────────
        if util.productive_ratio_pct == 0 and util.idle_hrs_total > 0:
            issues.append("zero productive engine use")
            severities.append("HIGH")
            evidence_parts.append(
                f"{util.idle_hrs_total:.0f}h cumulative idle with zero engine hours "
                f"over {asset.operating_days} days — asset is powered on but not working"
            )
            rec_parts.append(
                "review the active work order and consider reallocating or returning "
                "the asset to the dealership to avoid unnecessary rental cost and wear"
            )

        # ── Condition: Low productive ratio (some engine use) ─────────────
        elif 0 < util.productive_ratio_pct < PRODUCTIVE_RATIO_LOW:
            issues.append(f"low productive ratio ({util.productive_ratio_pct}%)")
            severities.append("MEDIUM")
            evidence_parts.append(util.label)
            rec_parts.append(
                "investigate cause of high idle time — consider driver coaching, "
                "shift scheduling review, or redeployment to a busier site"
            )

        # ── Condition: Low shift utilization ─────────────────────────────
        if (
            0 < util.shift_utilization_pct < SHIFT_UTIL_LOW
            and util.productive_ratio_pct >= PRODUCTIVE_RATIO_LOW
        ):
            issues.append(f"low shift utilization ({util.shift_utilization_pct}%)")
            severities.append("MEDIUM")
            evidence_parts.append(util.label)
            rec_parts.append(
                "consolidate work to fewer assets and consider returning underused "
                "equipment to the dealership or reallocating to a higher-demand site"
            )

        if not issues:
            continue  # asset is healthy — no recommendation needed

        # ── Consolidate into one recommendation per asset ─────────────────
        overall_severity = _highest(severities)
        issue_summary = (
            issues[0].capitalize() if len(issues) == 1
            else "; ".join(i.capitalize() for i in issues)
        )
        evidence_text = f"{asset.equipment_type} {asset.id}: " + ". Additionally: ".join(
            part[0].upper() + part[1:] for part in evidence_parts
        ) + "."
        rec_text = (
            rec_parts[0].capitalize() + "."
            if len(rec_parts) == 1
            else " ".join(
                (p.capitalize() if i == 0 else p) + "."
                for i, p in enumerate(rec_parts)
            )
        )

        recs.append(RecommendationOut(
            asset=asset.id,
            issue=issue_summary,
            severity=overall_severity,
            evidence=evidence_text,
            recommendation=rec_text,
        ))

    # Sort: CRITICAL → HIGH → MEDIUM → LOW
    recs.sort(key=lambda r: _SEVERITY_ORDER.get(r.severity, 99))
    return recs


@router.get("", response_model=list[RecommendationOut])
def get_recommendations(db: Session = Depends(get_db)):
    """
    Return actionable recommendations for every asset with detected issues.
    Correlated conditions per asset are consolidated into one recommendation.
    Results are ordered by severity (CRITICAL → LOW).
    """
    assets = db.query(Asset).order_by(Asset.id).all()
    return _build_recommendations(assets)
