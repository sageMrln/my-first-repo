"""
Clip Feed — plugs your existing bot's output into the agent council.

Two modes:
  1. load_from_file(path)  — reads a JSON file your bot already writes
  2. demo_clips()          — built-in sample clips for testing

JSON format your bot should produce (array of objects):
[
  {
    "url": "https://www.tiktok.com/@user/video/123",
    "platform": "tiktok",
    "title": "guy plays hide and seek in Walmart",
    "views": 450000,
    "likes": 38000,
    "shares": 12000,
    "completion_rate": 0.72,
    "category": "gaming",         // "gaming" | "irl" | "niche"
    "streamer": "xQc",            // optional
    "duration_seconds": 58
  },
  ...
]
"""

import json
from typing import List, Tuple
from agents.base_agent import Clip


def load_from_file(path: str) -> Tuple[List[Clip], List[Clip], List[Clip]]:
    with open(path, "r") as f:
        raw = json.load(f)

    gaming, irl, niche = [], [], []
    for item in raw:
        clip = Clip(
            url=item["url"],
            platform=item["platform"],
            title=item["title"],
            views=item.get("views", 0),
            likes=item.get("likes", 0),
            shares=item.get("shares", 0),
            completion_rate=item.get("completion_rate", 0.5),
            category=item["category"],
            streamer=item.get("streamer"),
            duration_seconds=item.get("duration_seconds", 60),
        )
        if clip.category == "gaming":
            gaming.append(clip)
        elif clip.category == "irl":
            irl.append(clip)
        else:
            niche.append(clip)

    return gaming, irl, niche


def demo_clips() -> Tuple[List[Clip], List[Clip], List[Clip]]:
    gaming = [
        Clip(
            url="https://www.tiktok.com/@xqc/video/001",
            platform="tiktok",
            title="xQc loses hide and seek in his own house for 20 minutes",
            views=890_000, likes=72_000, shares=31_000,
            completion_rate=0.81, category="gaming", streamer="xQc",
        ),
        Clip(
            url="https://youtube.com/shorts/abc123",
            platform="youtube",
            title="Minecraft pro gets destroyed by chicken in front of 50k viewers",
            views=420_000, likes=41_000, shares=18_000,
            completion_rate=0.74, category="gaming", streamer="Technoblade",
        ),
        Clip(
            url="https://www.instagram.com/reel/gam001",
            platform="instagram",
            title="Hide and seek gone wrong — streamer stuck in IKEA for 3 hours",
            views=310_000, likes=29_000, shares=14_500,
            completion_rate=0.68, category="gaming", streamer="HasanAbi",
        ),
        Clip(
            url="https://www.tiktok.com/@ludwig/video/002",
            platform="tiktok",
            title="Ludwig accidentally starts 12-hour chess match instead of speedrun",
            views=1_100_000, likes=95_000, shares=47_000,
            completion_rate=0.61, category="gaming", streamer="Ludwig",
        ),
    ]

    irl = [
        Clip(
            url="https://www.tiktok.com/@ironmouse/video/003",
            platform="tiktok",
            title="IRL streamer gets proposed to by random guy on pier — does not go well",
            views=2_300_000, likes=198_000, shares=87_000,
            completion_rate=0.88, category="irl", streamer="Nadia",
        ),
        Clip(
            url="https://youtube.com/shorts/irl001",
            platform="youtube",
            title="Streamer walks into wrong wedding on IRL stream — stays for cake",
            views=780_000, likes=66_000, shares=29_000,
            completion_rate=0.76, category="irl", streamer="Alinity",
        ),
        Clip(
            url="https://www.instagram.com/reel/irl002",
            platform="instagram",
            title="Tokyo IRL stream — guy in full samurai armor follows streamer for 6 blocks",
            views=540_000, likes=51_000, shares=22_000,
            completion_rate=0.71, category="irl", streamer="Robcdee",
        ),
        Clip(
            url="https://www.tiktok.com/@veibae/video/004",
            platform="tiktok",
            title="Street interviewer gets roasted by 8-year-old on IRL stream",
            views=1_800_000, likes=155_000, shares=63_000,
            completion_rate=0.83, category="irl", streamer="Mizkif",
        ),
    ]

    niche = [
        Clip(
            url="https://www.tiktok.com/@niche001/video/005",
            platform="tiktok",
            title="ASMR blacksmith makes sword while watching anime — 94% completion rate",
            views=210_000, likes=18_000, shares=9_400,
            completion_rate=0.94, category="niche", streamer=None,
        ),
        Clip(
            url="https://www.instagram.com/reel/niche001",
            platform="instagram",
            title="Guy reviews every 7-Eleven in Japan — episode 23 goes insane",
            views=380_000, likes=35_000, shares=21_000,
            completion_rate=0.79, category="niche", streamer=None,
        ),
        Clip(
            url="https://youtube.com/shorts/niche002",
            platform="youtube",
            title="Live auction for rare Pokémon card — bidder reveals identity at end",
            views=670_000, likes=58_000, shares=34_000,
            completion_rate=0.86, category="niche", streamer=None,
        ),
        Clip(
            url="https://www.tiktok.com/@niche002/video/006",
            platform="tiktok",
            title="Speedrunner beats Elden Ring blindfolded — community goes wild",
            views=450_000, likes=42_000, shares=19_000,
            completion_rate=0.77, category="niche", streamer=None,
        ),
    ]

    return gaming, irl, niche
