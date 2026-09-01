"""
Pydantic schemas — the API contract.

These are stable shapes that the frontend can depend on.
Internal DB models may evolve without breaking these contracts.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Site
# ---------------------------------------------------------------------------

class SiteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None


# ---------------------------------------------------------------------------
# Operator
# ---------------------------------------------------------------------------

class OperatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    license_class: Optional[str] = None
    contact: Optional[str] = None


# ---------------------------------------------------------------------------
# Asset
# ---------------------------------------------------------------------------

class AssetSummary(BaseModel):
    """Lightweight representation for list endpoints."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    equipment_type: str
    status: str
    site_id: Optional[str] = None
    operator_id: Optional[str] = None
    checkout_date: Optional[datetime] = None
    expected_return_date: Optional[datetime] = None
    engine_hrs_per_day: float
    idle_hrs_per_day: float
    operating_days: int
    customer_name: Optional[str] = None
    qr_code: Optional[str] = None
    rfid_tag: Optional[str] = None


class AssetDetail(AssetSummary):
    """Full asset detail including nested site/operator objects."""
    site: Optional[SiteOut] = None
    operator: Optional[OperatorOut] = None
    utilization: Optional["UtilizationOut"] = None


class UtilizationOut(BaseModel):
    """
    Defensible utilization calculation:
      engine_hrs / (engine_hrs + idle_hrs) × 100  for productive-time ratio
      engine_hrs / (operating_days × 8h shift)     for shift-utilization
    """
    engine_hrs_total: float
    idle_hrs_total: float
    operating_days: int
    productive_ratio_pct: float   # engine / (engine + idle) × 100
    shift_utilization_pct: float  # engine / (days × 8h) × 100  (capped at 100)
    label: str                    # human-readable explanation


# ---------------------------------------------------------------------------
# Rental Events
# ---------------------------------------------------------------------------

class CheckoutRequest(BaseModel):
    operator_id: Optional[str] = None
    site_id: Optional[str] = None
    customer_name: Optional[str] = None
    expected_return_date: Optional[datetime] = None
    notes: Optional[str] = None
    performed_by: Optional[str] = None
    identifier_method: Optional[str] = "manual"  # "qr" | "rfid" | "manual"


class CheckinRequest(BaseModel):
    notes: Optional[str] = None
    performed_by: Optional[str] = None
    identifier_method: Optional[str] = "manual"


class RentalEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: str
    event_type: str
    timestamp: datetime
    operator_id: Optional[str] = None
    site_id: Optional[str] = None
    customer_name: Optional[str] = None
    expected_return_date: Optional[datetime] = None
    notes: Optional[str] = None
    performed_by: Optional[str] = None
    identifier_method: Optional[str] = None


# ---------------------------------------------------------------------------
# Telemetry
# ---------------------------------------------------------------------------

class TelemetryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: str
    timestamp: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    engine_temp_c: Optional[float] = None
    engine_hours: Optional[float] = None
    fuel_level_pct: Optional[float] = None
    fuel_consumption_lph: Optional[float] = None
    idle_time_hours: Optional[float] = None
    seatbelt_on: Optional[bool] = None
    fault_code: Optional[str] = None
    fault_description: Optional[str] = None
    scenario: Optional[str] = None


class SimulateRequest(BaseModel):
    """
    Trigger a deterministic telemetry scenario for a given asset.
    scenario values:
      "normal" | "engine_overheat" | "location_mismatch"
      | "seatbelt_violation" | "high_idle" | "abnormal_fuel"
    """
    scenario: str = "normal"
    readings: int = 10           # how many data points to generate


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------

class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: str
    alert_type: str
    severity: str
    message: str
    evidence: Optional[str] = None
    resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------

class RecommendationOut(BaseModel):
    asset: str
    issue: str
    severity: str      # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    evidence: str
    recommendation: str


# ---------------------------------------------------------------------------
# Forecasts
# ---------------------------------------------------------------------------

class ForecastDataPoint(BaseModel):
    period: str          # e.g. "2025-05", "Week 18"
    demand: float        # historical or predicted asset-days
    is_forecast: bool    # False = historical, True = predicted


class ExpectedReturn(BaseModel):
    asset_id: str
    equipment_type: str
    expected_return_date: Optional[datetime]


class ForecastOut(BaseModel):
    equipment_type: str
    site_id: Optional[str] = None
    history: list[ForecastDataPoint]
    forecast: list[ForecastDataPoint]
    expected_returning: list[ExpectedReturn]
    recommended_allocation: int   # suggested fleet size for next period
    allocation_rationale: str
