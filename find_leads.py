#!/usr/bin/env python3
"""
find_leads.py — Find small businesses in Aarhus / Central Jutland (Midtjylland)
that have a PHONE NUMBER but NO WEBSITE, so you can cold-call them and pitch a
website (to rent or buy).

Data source: OpenStreetMap via the Overpass API.
  - Free, no signup, no API key.
  - Returns businesses tagged with a phone but with NO website tag — which is
    exactly the cold-call target we want.

Output: a CSV file (leads_aarhus.csv) ready to open in Excel / Google Sheets.

------------------------------------------------------------------------------
HOW TO RUN
------------------------------------------------------------------------------
You need Python 3 installed (Mac/Linux usually have it; Windows: python.org).
Open a terminal in this folder and run:

    python3 find_leads.py

That's it. No extra libraries to install. A file called leads_aarhus.csv will
appear next to this script. Start calling the top of the list.

Want a different area or business types? Edit the CONFIG section below.

------------------------------------------------------------------------------
IMPORTANT — A FEW HONEST CAVEATS
------------------------------------------------------------------------------
1. "No website tag in OpenStreetMap" is a strong signal, but not a 100%
   guarantee the business has zero web presence. Before pitching, do a quick
   10-second Google of the name to confirm. The script flags whether the
   business at least has a Facebook page (FB-only businesses are still great
   targets — they often want a "real" site).

2. Denmark cold-calling rules: unsolicited B2B sales calls to registered
   companies are generally allowed. Be more careful with one-person /
   sole-trader businesses (consumer rules + the Robinson list can apply).
   When in doubt, keep it B2B and respect anyone who asks not to be called.

3. OSM coverage isn't exhaustive — not every tiny shop is mapped. Run it,
   then widen the area (see CONFIG) if you want more volume.
"""

import csv
import json
import time
import urllib.error
import urllib.parse
import urllib.request

# =============================================================================
# CONFIG — edit these if you want
# =============================================================================

# Geographic area (an OpenStreetMap administrative area name).
#   "Aarhus Kommune"      -> Aarhus municipality (default, best odds, focused)
#   "Region Midtjylland"  -> ALL of Central Jutland (much bigger, more leads)
# You can also try other municipalities: "Randers Kommune", "Horsens Kommune",
# "Silkeborg Kommune", "Viborg Kommune", "Herning Kommune", etc.
AREA_NAME = "Aarhus Kommune"

# Fallback bounding box (used automatically if AREA_NAME can't be resolved).
# This box roughly covers greater Aarhus. (south, west, north, east)
FALLBACK_BBOX = (56.05, 10.05, 56.30, 10.35)

# How many leads to write to the CSV. Set higher for a bigger batch.
MAX_LEADS = 100

# Output file name.
OUTPUT_CSV = "leads_aarhus.csv"

# Overpass API endpoint (mirror). If one is slow, try the alternates below.
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
# Alternates you can paste in above if needed:
#   https://overpass.kumi.systems/api/interpreter
#   https://overpass.private.coffee/api/interpreter

# =============================================================================
# Business categories to search (OpenStreetMap tags).
# These are local, small, service businesses that most need a website.
# =============================================================================
SHOP_VALUES = [
    "hairdresser", "beauty", "nail_salon", "massage", "tattoo", "optician",
    "bakery", "butcher", "greengrocer", "deli", "confectionery", "seafood",
    "florist", "jewelry", "shoes", "clothes", "boutique", "tailor",
    "dry_cleaning", "laundry", "car_repair", "tyres", "motorcycle_repair",
    "bicycle", "hardware", "doityourself", "pet", "pet_grooming",
    "hearing_aids", "interior_decoration", "furniture", "kitchen",
    "frame", "watches", "photo", "travel_agency",
]
AMENITY_VALUES = [
    "restaurant", "cafe", "fast_food", "bar", "pub", "ice_cream",
    "veterinary", "driving_school", "dentist", "doctors", "clinic",
]
# Any "craft" value counts (plumbers, electricians, carpenters, painters...).
INCLUDE_ALL_CRAFTS = True

# Tags that count as "the business has a website / real web presence".
# If ANY of these is present, we skip the business.
WEBSITE_TAGS = ["website", "contact:website", "url", "website:menu"]

# Tags we read as a phone number.
PHONE_TAGS = ["phone", "contact:phone", "contact:mobile", "mobile"]


# =============================================================================
# Implementation
# =============================================================================

def build_query(area_def, area_filter):
    """area_def: optional Overpass statement defining .searchArea (or "").
       area_filter: the spatial filter appended to each query line."""
    shop_re = "|".join(SHOP_VALUES)
    amenity_re = "|".join(AMENITY_VALUES)
    lines = [
        f'  nwr["shop"~"^({shop_re})$"]{area_filter};',
        f'  nwr["amenity"~"^({amenity_re})$"]{area_filter};',
    ]
    if INCLUDE_ALL_CRAFTS:
        lines.append(f'  nwr["craft"]{area_filter};')
    body = "\n".join(lines)
    return f"""[out:json][timeout:180];
{area_def}
(
{body}
);
out tags center;""".strip()


def make_area_clause_by_name(name):
    # Resolve the named area, then filter elements inside it.
    return (
        f'area["name"="{name}"]["boundary"="administrative"]->.searchArea;',
        "(area.searchArea)",
    )


def make_area_clause_by_bbox(bbox):
    s, w, n, e = bbox
    return ("", f"({s},{w},{n},{e})")


def run_overpass(query):
    data = urllib.parse.urlencode({"data": query}).encode()
    req = urllib.request.Request(
        OVERPASS_URL,
        data=data,
        headers={"User-Agent": "aarhus-lead-finder/1.0 (personal cold-call list)"},
    )
    for attempt in range(1, 5):
        try:
            with urllib.request.urlopen(req, timeout=200) as resp:
                return json.loads(resp.read().decode())
        except (urllib.error.URLError, TimeoutError) as exc:
            wait = 2 ** attempt
            print(f"  Overpass attempt {attempt} failed ({exc}); retrying in {wait}s...")
            time.sleep(wait)
    raise SystemExit("Overpass API unreachable after several tries. "
                     "Try a different OVERPASS_URL mirror in the CONFIG section.")


def first_tag(tags, keys):
    for k in keys:
        v = tags.get(k)
        if v:
            return v.strip()
    return ""


def has_any_tag(tags, keys):
    return any(tags.get(k, "").strip() for k in keys)


def category_of(tags):
    for k in ("shop", "amenity", "craft", "office"):
        if tags.get(k):
            return f"{k}={tags[k]}"
    return ""


def address_of(tags):
    parts = [
        " ".join(p for p in (tags.get("addr:street", ""),
                             tags.get("addr:housenumber", "")) if p).strip(),
        tags.get("addr:postcode", ""),
        tags.get("addr:city", ""),
    ]
    return ", ".join(p for p in parts if p)


def extract_leads(result):
    seen = set()
    leads = []
    for el in result.get("elements", []):
        tags = el.get("tags", {})
        if not tags:
            continue
        # Must have a phone, must NOT have a website.
        phone = first_tag(tags, PHONE_TAGS)
        if not phone:
            continue
        if has_any_tag(tags, WEBSITE_TAGS):
            continue
        name = tags.get("name") or tags.get("operator") or ""
        if not name:
            continue
        key = (name.lower(), phone.replace(" ", ""))
        if key in seen:
            continue
        seen.add(key)

        facebook = first_tag(tags, ["contact:facebook", "facebook"])
        leads.append({
            "name": name,
            "phone": phone,
            "category": category_of(tags),
            "address": address_of(tags),
            "city": tags.get("addr:city", ""),
            "postcode": tags.get("addr:postcode", ""),
            "email": first_tag(tags, ["email", "contact:email"]),
            "has_facebook": "yes" if facebook else "no",
            "facebook_url": facebook,
            "osm_link": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
        })
    # Best odds first: businesses with NO facebook either (zero web presence).
    leads.sort(key=lambda r: (r["has_facebook"] == "yes", r["name"].lower()))
    return leads


def write_csv(leads, path):
    fields = ["name", "phone", "category", "address", "city", "postcode",
              "email", "has_facebook", "facebook_url", "osm_link"]
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for row in leads:
            w.writerow(row)


def main():
    print(f"Searching OpenStreetMap for businesses in: {AREA_NAME}")
    print("(phone number present, no website) — this can take 30-90 seconds...\n")

    # Try by area name first; fall back to bounding box.
    area_def, area_filter = make_area_clause_by_name(AREA_NAME)
    result = run_overpass(build_query(area_def, area_filter))
    leads = extract_leads(result)

    if not leads:
        print("No results via area name — falling back to Aarhus bounding box...")
        area_def, area_filter = make_area_clause_by_bbox(FALLBACK_BBOX)
        result = run_overpass(build_query(area_def, area_filter))
        leads = extract_leads(result)

    total = len(leads)
    leads = leads[:MAX_LEADS]
    write_csv(leads, OUTPUT_CSV)

    no_fb = sum(1 for r in leads if r["has_facebook"] == "no")
    print(f"\nDone. Found {total} matching businesses; wrote {len(leads)} to "
          f"{OUTPUT_CSV}.")
    print(f"  - {no_fb} of them have NO Facebook either (zero web presence — "
          f"call these first).")
    print("\nNext steps:")
    print("  1. Open leads_aarhus.csv in Excel or Google Sheets.")
    print("  2. Quick-Google a name before calling, to confirm no website.")
    print("  3. Start dialling. Good luck!")


if __name__ == "__main__":
    main()
