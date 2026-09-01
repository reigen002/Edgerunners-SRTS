"""
SQLAlchemy ORM models — the source of truth for the database schema.

Tables
------
sites          — physical locations where equipment is deployed
operators      — personnel operating equipment
assets         — the rental equipment fleet
rental_events  — checkout / checkin lifecycle events
telemetry      — timestamped sensor readings per asset
alerts         — generated anomaly/alert records
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ---------------------------------------------------------------------------
# Supporting tables
# ---------------------------------------------------------------------------

class Site(Base):
    __tablename__ = "sites"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    assets: Mapped[list["Asset"]] = relationship(back_populates="site")


class Operator(Base):
    __tablename__ = "operators"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    license_class: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    contact: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    assets: Mapped[list["Asset"]] = relationship(back_populates="operator")


# ---------------------------------------------------------------------------
# Core asset table
# ---------------------------------------------------------------------------

class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)
    equipment_type: Mapped[str] = mapped_column(String(50))          # Excavator, Bulldozer, …
    status: Mapped[str] = mapped_column(String(30), default="available")
    # "available" | "checked_out" | "overdue" | "maintenance"

    # FK — nullable because intentional anomaly data (EQX1002, EQX1007)
    site_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("sites.id"), nullable=True
    )
    operator_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("operators.id"), nullable=True
    )

    # Current rental window
    checkout_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expected_return_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Seed-data telemetry parameters (per-day rates)
    engine_hrs_per_day: Mapped[float] = mapped_column(Float, default=0.0)
    idle_hrs_per_day: Mapped[float] = mapped_column(Float, default=0.0)
    operating_days: Mapped[int] = mapped_column(Integer, default=0)

    # Customer / rental metadata
    customer_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    qr_code: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    rfid_tag: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now()
    )

    # Relationships
    site: Mapped[Optional[Site]] = relationship(back_populates="assets")
    operator: Mapped[Optional[Operator]] = relationship(back_populates="assets")
    events: Mapped[list["RentalEvent"]] = relationship(
        back_populates="asset", order_by="RentalEvent.timestamp.desc()"
    )
    telemetry: Mapped[list["Telemetry"]] = relationship(
        back_populates="asset", order_by="Telemetry.timestamp.desc()"
    )
    alerts: Mapped[list["Alert"]] = relationship(
        back_populates="asset", order_by="Alert.created_at.desc()"
    )


# ---------------------------------------------------------------------------
# Lifecycle events
# ---------------------------------------------------------------------------

class RentalEvent(Base):
    __tablename__ = "rental_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"))
    event_type: Mapped[str] = mapped_column(String(30))
    # "checkout" | "checkin" | "overdue_flagged" | "location_alert" | "status_change"

    timestamp: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # Event payload (freeform context)
    operator_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    site_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    customer_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    expected_return_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    performed_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # identifier method: "qr" | "rfid" | "manual"
    identifier_method: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    asset: Mapped[Asset] = relationship(back_populates="events")


# ---------------------------------------------------------------------------
# Telemetry
# ---------------------------------------------------------------------------

class Telemetry(Base):
    __tablename__ = "telemetry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"))
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)

    # GPS
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Engine / usage
    engine_temp_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    engine_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fuel_level_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fuel_consumption_lph: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    idle_time_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Safety
    seatbelt_on: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # Fault
    fault_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    fault_description: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    # Scenario tag for demo mode
    scenario: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    asset: Mapped[Asset] = relationship(back_populates="telemetry")


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------

class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"))

    alert_type: Mapped[str] = mapped_column(String(50))
    # "overdue" | "no_operator" | "no_site" | "high_idle" | "engine_overheat"
    # "location_mismatch" | "seatbelt_violation" | "abnormal_fuel" | "low_utilization"

    severity: Mapped[str] = mapped_column(String(10))  # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    message: Mapped[str] = mapped_column(Text)
    evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    asset: Mapped[Asset] = relationship(back_populates="alerts")
