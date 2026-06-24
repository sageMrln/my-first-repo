from dataclasses import dataclass, field
from typing import List, Optional
import anthropic
import config


@dataclass
class Clip:
    url: str
    platform: str
    title: str
    views: int
    likes: int
    shares: int
    completion_rate: float   # 0.0 - 1.0
    category: str
    streamer: Optional[str] = None
    duration_seconds: int = 60
    score: float = 0.0
    pitch: str = ""
    agent_name: str = ""
    post_frequency: str = ""


class BaseAgent:
    NAME = "Agent"
    SPECIALTY = "general content"
    ANIME_ROLE = "Scout"
    PERSONALITY = "analytical"

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        self.history: List[dict] = []
        self._system = self._build_system()

    def _build_system(self) -> str:
        return f"""You are {self.NAME}, a social media clip curator for a professional clipping company.

Role: {self.ANIME_ROLE}
Specialty: {self.SPECIALTY}
Personality: {self.PERSONALITY}

Core job: Find and pitch clips that will perform on TikTok, Instagram Reels, and YouTube Shorts.

Rules you live by:
- TikTok cares about completion rate and shares above raw views.
- Instagram rewards saves and shares more than likes.
- YouTube Shorts rewards click-through rate and watch time.
- Never pitch a clip just because it has high views if the engagement is trash.
- Always give a posting frequency recommendation (daily / 3-4x week / 1-2x week / monthly).
- Be opinionated. You have taste. Defend your picks.

Stay in character at all times. Be direct, passionate, and sharp."""

    def _chat(self, user_message: str) -> str:
        self.history.append({"role": "user", "content": user_message})
        response = self.client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=self._system,
            messages=self.history,
        )
        reply = response.content[0].text
        self.history.append({"role": "assistant", "content": reply})
        return reply

    def evaluate_clips(self, clips: List[Clip]) -> str:
        clip_block = "\n".join(
            f"[{i+1}] {c.title}\n"
            f"    Platform: {c.platform} | Views: {c.views:,} | Likes: {c.likes:,} | "
            f"Shares: {c.shares:,} | Completion: {c.completion_rate*100:.0f}%\n"
            f"    URL: {c.url}"
            for i, c in enumerate(clips)
        )

        return self._chat(
            f"Here are today's clips in your specialty area. Pick your TOP 3 and pitch them hard:\n\n"
            f"{clip_block}\n\n"
            f"For each pick, give:\n"
            f"1. Why it will blow up\n"
            f"2. Best platform to push it on\n"
            f"3. Posting frequency recommendation\n"
            f"4. Confidence score (1-10)\n\n"
            f"Be specific and stay in character."
        )

    def debate(self, council_transcript: str) -> str:
        return self._chat(
            f"Council debate so far:\n\n{council_transcript}\n\n"
            f"React now. Defend your picks if challenged. "
            f"Call out weak picks from others if you see them. "
            f"Or concede if someone made a stronger case — but only if they actually did. "
            f"Stay in character."
        )

    def reset(self):
        self.history = []
