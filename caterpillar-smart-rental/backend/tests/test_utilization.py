"""
test_utilization.py — golden values for all 7 seeded assets.

Formula:
  productive_ratio_pct = engine / (engine + idle) * 100     (0 if both 0)
  shift_utilization_pct = min(engine / (days * 8) * 100, 100)

Golden values (engine_hrs_per_day, idle_hrs_per_day, operating_days):
  EQX1001  1.5, 10.0, 15  →  13%,  19%
  EQX1002  0.0, 11.0, 20  →   0%,   0%
  EQX1003  7.5,  0.5, 25  →  94%,  94%
  EQX1004  2.0,  9.0, 10  →  18%,  25%
  EQX1005  8.0,  0.0, 30  → 100%, 100%
  EQX1006  3.0,  6.0, 18  →  33%,  38%
  EQX1007  0.0, 12.0, 12  →   0%,   0%
"""
import pytest
from app.utilization import calculate_utilization


GOLDEN = [
    # (asset_id, eng/day, idle/day, days, prod_ratio, shift_util)
    ("EQX1001", 1.5, 10.0, 15, 13.0, 18.8),
    ("EQX1002", 0.0, 11.0, 20,  0.0,  0.0),
    ("EQX1003", 7.5,  0.5, 25, 93.8, 93.8),
    ("EQX1004", 2.0,  9.0, 10, 18.2, 25.0),
    ("EQX1005", 8.0,  0.0, 30, 100.0, 100.0),
    ("EQX1006", 3.0,  6.0, 18, 33.3, 37.5),
    ("EQX1007", 0.0, 12.0, 12,  0.0,  0.0),
]


@pytest.mark.parametrize("asset_id,eng,idle,days,expected_prod,expected_shift", GOLDEN)
def test_golden_utilization(asset_id, eng, idle, days, expected_prod, expected_shift):
    u = calculate_utilization(eng, idle, days)
    assert abs(u.productive_ratio_pct - expected_prod) <= 0.5, (
        f"{asset_id}: productive_ratio expected ~{expected_prod}, got {u.productive_ratio_pct}"
    )
    assert abs(u.shift_utilization_pct - expected_shift) <= 0.5, (
        f"{asset_id}: shift_utilization expected ~{expected_shift}, got {u.shift_utilization_pct}"
    )


def test_zero_both():
    """Asset with 0 engine and 0 idle — both metrics are 0, no division error."""
    u = calculate_utilization(0.0, 0.0, 10)
    assert u.productive_ratio_pct == 0.0
    assert u.shift_utilization_pct == 0.0


def test_shift_capped_at_100():
    """Unrealistically high engine hours must cap at 100%."""
    u = calculate_utilization(100.0, 0.0, 1)
    assert u.shift_utilization_pct == 100.0


def test_label_is_non_empty():
    u = calculate_utilization(2.0, 8.0, 5)
    assert isinstance(u.label, str)
    assert len(u.label) > 10
