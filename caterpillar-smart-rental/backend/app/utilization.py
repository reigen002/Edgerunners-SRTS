"""
Utilization calculation helpers.

Defensible formula
------------------
We track two distinct metrics and expose both to the frontend:

1. productive_ratio_pct
   = engine_hrs / (engine_hrs + idle_hrs) × 100
   Answers: "Of the time the machine was running, how much was productive?"
   Source: SAE J1939 telematics convention

2. shift_utilization_pct
   = engine_hrs / (operating_days × 8h) × 100   [capped at 100]
   Answers: "How much of the available 8-hour shift capacity was used?"
   8h is a standard single-shift day; adjust to 10h for extended-shift sites.

Both are shown to the user with a plain-English label so no "magic number"
is presented without context.
"""
from app.schemas import UtilizationOut


SHIFT_HOURS = 8.0   # standard single-shift reference


def calculate_utilization(
    engine_hrs_per_day: float,
    idle_hrs_per_day: float,
    operating_days: int,
) -> UtilizationOut:
    days = max(operating_days, 1)  # guard divide-by-zero
    total_engine = engine_hrs_per_day * days
    total_idle = idle_hrs_per_day * days

    running_total = total_engine + total_idle
    productive_ratio = (
        round(total_engine / running_total * 100, 1) if running_total > 0 else 0.0
    )

    shift_capacity = days * SHIFT_HOURS
    shift_util = round(min(total_engine / shift_capacity * 100, 100.0), 1)

    if productive_ratio == 0 and total_idle > 0:
        label = (
            f"Machine ran {total_idle:.0f}h idle with zero productive engine use "
            f"over {days} days — likely stationary/unassigned."
        )
    elif productive_ratio >= 80:
        label = (
            f"{total_engine:.0f}h engine / {total_idle:.0f}h idle over {days} days "
            f"— well-utilised ({productive_ratio}% productive time)."
        )
    else:
        label = (
            f"{total_engine:.0f}h engine / {total_idle:.0f}h idle over {days} days "
            f"— {productive_ratio}% productive time, "
            f"{shift_util}% of single-shift capacity."
        )

    return UtilizationOut(
        engine_hrs_total=round(total_engine, 2),
        idle_hrs_total=round(total_idle, 2),
        operating_days=days,
        productive_ratio_pct=productive_ratio,
        shift_utilization_pct=shift_util,
        label=label,
    )
