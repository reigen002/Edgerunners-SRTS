"""
demand_supplement.py

Loads the supplementary synthetic demand history from
  data/scenarios/demand_history_supplement.json

This file is repo-relative to the backend package root.  The loader walks
upward from this file's location to find it, so it works whether the server
is started from the repo root, from caterpillar-smart-rental/, or from
caterpillar-smart-rental/backend/.

The data is intentionally separate from the official seven asset records —
it represents synthetic historical demand at the site × equipment-type level
and must NOT be mixed into or derived from the asset rows.
"""
import json
import os
from typing import Optional

# ---------------------------------------------------------------------------
# Path resolution — find the JSON no matter where the server is launched from
# ---------------------------------------------------------------------------

def _find_supplement_path() -> Optional[str]:
    """
    Walk upward from this file's directory looking for
    data/scenarios/demand_history_supplement.json.
    Returns the first match, or None if not found.
    """
    here = os.path.dirname(os.path.abspath(__file__))
    candidate = here
    for _ in range(6):  # at most 6 levels up
        path = os.path.join(candidate, "data", "scenarios", "demand_history_supplement.json")
        if os.path.isfile(path):
            return path
        parent = os.path.dirname(candidate)
        if parent == candidate:
            break
        candidate = parent
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_SUPPLEMENT_CACHE: Optional[dict] = None


def _load_raw() -> dict:
    global _SUPPLEMENT_CACHE
    if _SUPPLEMENT_CACHE is not None:
        return _SUPPLEMENT_CACHE
    path = _find_supplement_path()
    if path is None:
        _SUPPLEMENT_CACHE = {"demand_history": []}
        return _SUPPLEMENT_CACHE
    with open(path, encoding="utf-8") as f:
        _SUPPLEMENT_CACHE = json.load(f)
    return _SUPPLEMENT_CACHE


def get_demand_history(site_id: str, equipment_type: str) -> list[dict]:
    """
    Return the demand history periods for a (site_id, equipment_type) pair.

    Each period dict has keys: "period" (str YYYY-MM), "count" (int).
    Returns an empty list if no data found.
    """
    data = _load_raw()
    for entry in data.get("demand_history", []):
        if (
            entry.get("site_id") == site_id
            and entry.get("equipment_type") == equipment_type
        ):
            return list(entry.get("periods", []))
    return []


def all_supplement_segments() -> list[dict]:
    """
    Return all (site_id, equipment_type) segments in the supplement file.
    Each element has keys: site_id, equipment_type, periods[].
    """
    data = _load_raw()
    return [
        {
            "site_id": entry["site_id"],
            "equipment_type": entry["equipment_type"],
            "periods": list(entry.get("periods", [])),
        }
        for entry in data.get("demand_history", [])
    ]
