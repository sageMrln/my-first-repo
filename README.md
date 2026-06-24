# Aarhus cold-call lead finder

Finds small businesses in **Aarhus / Central Jutland (Midtjylland)** that have a
**phone number but no website** — ideal targets to cold-call and pitch a website
(to rent or buy).

## Quick start

1. Make sure you have **Python 3** (Mac/Linux usually do; Windows: [python.org](https://www.python.org/downloads/)).
2. In a terminal, from this folder, run:

   ```bash
   python3 find_leads.py
   ```

3. A file **`leads_aarhus.csv`** appears. Open it in Excel or Google Sheets and
   start calling — the businesses with *zero* web presence (no website **and**
   no Facebook) are sorted to the top.

No libraries to install. The script uses only Python's standard library.

## What it does

- Queries **OpenStreetMap** (via the free Overpass API — no signup, no key).
- Keeps businesses that have a phone tag but **no** website tag.
- Covers local service businesses that most need a site: hairdressers, beauty/
  nail salons, restaurants, cafés, bakeries, butchers, car repair, florists,
  vets, driving schools, and all trades (plumbers, electricians, carpenters,
  painters, …).
- Flags whether each has a Facebook page (Facebook-only businesses are still
  great targets — pitch them a "real" site).

## Customizing

Open `find_leads.py` and edit the **CONFIG** section near the top:

- `AREA_NAME` — default `"Aarhus Kommune"`. Set to `"Region Midtjylland"` for all
  of Central Jutland, or another municipality (e.g. `"Randers Kommune"`,
  `"Silkeborg Kommune"`, `"Horsens Kommune"`).
- `MAX_LEADS` — how many rows to write (default 100).
- `SHOP_VALUES` / `AMENITY_VALUES` — which business types to include.

## CSV columns

`name, phone, category, address, city, postcode, email, has_facebook, facebook_url, osm_link`

## Honest caveats

- "No website tag in OpenStreetMap" is a strong signal but not a guarantee.
  Quick-Google each name before pitching (10 seconds) to confirm.
- OSM coverage isn't exhaustive — widen `AREA_NAME` for more volume.
- **Cold-calling in Denmark:** unsolicited **B2B** calls to registered companies
  are generally allowed; be more careful with one-person / sole-trader
  businesses (consumer rules + the Robinson list can apply). Respect anyone who
  asks not to be called.

## Why a script, and not the list directly?

This was built inside a sandboxed cloud environment whose network policy blocks
outbound data sources (Overpass, business registries, etc.). Those sources work
fine from your own machine — so running `find_leads.py` locally produces the
list directly.
