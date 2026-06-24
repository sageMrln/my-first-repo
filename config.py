import os

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

USER_EMAIL = "osefemiradi@gmail.com"

PLATFORMS = ["tiktok", "instagram", "youtube"]

# Algorithm weights per platform (what matters most)
PLATFORM_WEIGHTS = {
    "tiktok": {
        "completion_rate": 0.40,
        "engagement_rate": 0.30,
        "shares": 0.20,
        "views": 0.10,
    },
    "instagram": {
        "saves": 0.35,
        "shares": 0.30,
        "engagement_rate": 0.25,
        "views": 0.10,
    },
    "youtube": {
        "click_through_rate": 0.35,
        "watch_time": 0.35,
        "engagement_rate": 0.20,
        "views": 0.10,
    },
}

# Posting frequency bands
FREQUENCY = {
    "daily":   "1-2x per day",
    "weekly":  "3-4x per week",
    "sparse":  "1-2x per week",
    "monthly": "4-6x per month",
}
