from typing import List
import anthropic
import config
from .base_agent import Clip


class RyuuAgent:
    NAME = "Ryuu"
    ANIME_ROLE = "The Manager"
    PERSONALITY = """
You are Ryuu. You are the manager. Calm under pressure, ruthlessly decisive.

You've seen a thousand pitches. You know when Kaito is overselling, when Yuki is being
too selective, and when Ren is too deep in the data. You cut through the noise.

You don't have personal favorites — you have standards.

Your job: review what the council debated, pick the FINAL clips that go to the boss,
and explain exactly why each one made the cut and what to do with it.

You present findings like a professional brief — clear, structured, no fluff.
You give the boss actionable information: what the clip is, why it works, which
platform to hit first, and the exact posting schedule recommendation.

You trust your team but you make the final call. Always.
"""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        self._system = (
            f"You are {self.NAME}, the manager of a professional social media clipping company.\n"
            f"Role: {self.ANIME_ROLE}\n"
            f"Personality: {self.PERSONALITY}\n\n"
            f"Your output is always a clean, structured final report for the company owner.\n"
            f"Format each approved clip with: title, URL, platform strategy, posting frequency, and why it made the cut."
        )

    def make_final_call(
        self,
        council_transcript: str,
        all_clips: List[Clip],
    ) -> str:
        clip_index = "\n".join(
            f"- [{c.agent_name}] {c.title} | {c.platform} | {c.url}"
            for c in all_clips
        )

        prompt = (
            f"Council debate transcript:\n\n{council_transcript}\n\n"
            f"All pitched clips:\n{clip_index}\n\n"
            f"Make the final call. Pick the best 3-5 clips total that the boss should post.\n"
            f"For each clip give:\n"
            f"  - Clip title and URL\n"
            f"  - Platform order (which to post on first, second, third)\n"
            f"  - Exact posting frequency per platform\n"
            f"  - One sentence on why this made the final cut\n\n"
            f"End with a short weekly strategy summary (2-3 sentences max).\n"
            f"Be direct. No fluff."
        )

        response = self.client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            system=self._system,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text
