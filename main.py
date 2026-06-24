#!/usr/bin/env python3
"""
Social Media Clipping Company — Agent Council
----------------------------------------------
Agents:
  Kaito  — Gaming funny moments specialist
  Yuki   — IRL streamer viral moments specialist
  Ren    — Niche content trend oracle
  Ryuu   — Manager, makes the final call

Usage:
  python main.py                      # runs with built-in demo clips
  python main.py --clips clips.json   # runs with your bot's clip feed
  python main.py --demo               # same as default
"""

import argparse
import sys
from datetime import datetime

from agents import KaitoAgent, YukiAgent, RenAgent, RyuuAgent, Council
from clip_feed import demo_clips, load_from_file


BANNER = """
╔══════════════════════════════════════════════════════════════╗
║           SOCIAL MEDIA CLIPPING COMPANY                      ║
║                                                              ║
║   Kaito  — Gaming Scout                                      ║
║   Yuki   — IRL Street Observer                               ║
║   Ren    — Niche Trend Oracle                                ║
║   Ryuu   — The Manager                                       ║
╚══════════════════════════════════════════════════════════════╝
"""


def run(clip_source: str | None = None, save_report: bool = True):
    print(BANNER)
    print(f"Session started: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")

    # Load clips
    if clip_source:
        print(f"Loading clips from: {clip_source}")
        gaming_clips, irl_clips, niche_clips = load_from_file(clip_source)
    else:
        print("Running with demo clips (use --clips your_file.json for real data)")
        gaming_clips, irl_clips, niche_clips = demo_clips()

    print(
        f"Clips loaded — Gaming: {len(gaming_clips)} | "
        f"IRL: {len(irl_clips)} | Niche: {len(niche_clips)}\n"
    )

    # Boot agents
    print("Waking up the team...\n")
    kaito = KaitoAgent()
    yuki = YukiAgent()
    ren = RenAgent()
    ryuu = RyuuAgent()
    council = Council(kaito, yuki, ren, ryuu)

    # Run the council
    print("Council session starting...\n")
    transcript, final_report = council.run(gaming_clips, irl_clips, niche_clips)

    # Print Ryuu's final report
    print("\n" + "★" * 60)
    print("  RYUU'S FINAL REPORT — YOUR CLIP BRIEF FOR TODAY")
    print("★" * 60)
    print(final_report)

    # Save outputs
    if save_report:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        report_path = f"report_{timestamp}.txt"
        transcript_path = f"transcript_{timestamp}.txt"

        with open(report_path, "w") as f:
            f.write(final_report)

        with open(transcript_path, "w") as f:
            f.write(transcript)

        print(f"\nSaved:\n  Final report  → {report_path}")
        print(f"  Full transcript → {transcript_path}")

    return final_report


def main():
    parser = argparse.ArgumentParser(description="Social Media Clipping Agent Council")
    parser.add_argument("--clips", type=str, help="Path to JSON clip feed from your bot")
    parser.add_argument("--demo", action="store_true", help="Run with built-in demo clips")
    parser.add_argument("--no-save", action="store_true", help="Don't save report to file")
    args = parser.parse_args()

    clip_source = None if args.demo else args.clips

    try:
        run(clip_source=clip_source, save_report=not args.no_save)
    except KeyboardInterrupt:
        print("\n\nSession ended.")
        sys.exit(0)


if __name__ == "__main__":
    main()
