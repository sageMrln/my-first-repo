from typing import List, Tuple
from .base_agent import BaseAgent, Clip
from .ryuu import RyuuAgent


class Council:
    """
    The three specialist agents pitch their clips, debate for 2 rounds,
    then Ryuu makes the final call and returns a formatted brief.
    """

    def __init__(
        self,
        kaito: BaseAgent,
        yuki: BaseAgent,
        ren: BaseAgent,
        ryuu: RyuuAgent,
    ):
        self.agents: List[BaseAgent] = [kaito, yuki, ren]
        self.ryuu = ryuu

    def _header(self, name: str, role: str) -> str:
        return f"\n{'='*60}\n[{name} — {role}]\n{'='*60}\n"

    def run(
        self,
        gaming_clips: List[Clip],
        irl_clips: List[Clip],
        niche_clips: List[Clip],
    ) -> Tuple[str, str]:
        """
        Returns (full_transcript, ryuu_final_report).
        """
        clip_sets = [gaming_clips, irl_clips, niche_clips]
        transcript = ""
        all_pitched: List[Clip] = []

        # ── Round 1: Each agent pitches their best finds ──────────────────
        transcript += "\n" + "━" * 60
        transcript += "\n  COUNCIL SESSION — ROUND 1: PITCHES"
        transcript += "\n" + "━" * 60

        for agent, clips in zip(self.agents, clip_sets):
            transcript += self._header(agent.NAME, agent.ANIME_ROLE)
            pitch = agent.evaluate_clips(clips)
            transcript += pitch
            # Tag pitched clips with agent name for Ryuu
            for c in clips:
                c.agent_name = agent.NAME
            all_pitched.extend(clips)

        # ── Round 2: Agents react to each other ───────────────────────────
        transcript += "\n\n" + "━" * 60
        transcript += "\n  COUNCIL SESSION — ROUND 2: DEBATE"
        transcript += "\n" + "━" * 60

        for agent in self.agents:
            transcript += self._header(agent.NAME, agent.ANIME_ROLE)
            reaction = agent.debate(transcript)
            transcript += reaction

        # ── Ryuu makes the final call ──────────────────────────────────────
        transcript += "\n\n" + "━" * 60
        transcript += "\n  RYUU — FINAL DECISION"
        transcript += "\n" + "━" * 60

        final_report = self.ryuu.make_final_call(transcript, all_pitched)
        transcript += self._header(self.ryuu.NAME, self.ryuu.ANIME_ROLE)
        transcript += final_report

        return transcript, final_report
