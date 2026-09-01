"""
Single source of truth for the demo reference date.

DEMO_NOW = 2025-05-12

All business logic that is time-relative (overdue detection, status
calculations, return-date comparisons) must use get_demo_now() rather
than the real system clock so that the demo behaves identically
regardless of when or where it is run.

Real wall-clock timestamps are still appropriate for:
  - telemetry row timestamps (actual insert time)
  - lifecycle event timestamps (actual event time)

Override via environment variable for CI or alternative demo dates:
  SRTS_DEMO_DATE=2025-06-01  uvicorn app.main:app --reload
"""
import os
from datetime import date, datetime, timezone


DEMO_NOW_DEFAULT = date(2025, 5, 12)


def get_demo_date() -> date:
    """Return the configured demo reference date (today for business logic)."""
    raw = os.environ.get("SRTS_DEMO_DATE", "").strip()
    if raw:
        return date.fromisoformat(raw)
    return DEMO_NOW_DEFAULT


def get_demo_now() -> datetime:
    """Return the demo reference date as a timezone-aware midnight UTC datetime."""
    d = get_demo_date()
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
