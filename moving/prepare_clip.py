#!/usr/bin/env python3
"""Prepare ordered RGB frames for MoSca; source video is not modified."""
import argparse
import json
import shutil
import subprocess
from pathlib import Path

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("video", type=Path)
    p.add_argument("workspace", type=Path)
    p.add_argument("--start", type=float, default=0)
    p.add_argument("--duration", type=float, default=5)
    p.add_argument("--fps", type=float, default=12)
    p.add_argument("--max-side", type=int, default=768)
    a = p.parse_args()
    if not a.video.is_file():
        p.error("Input video does not exist.")
    if a.start < 0 or a.duration <= 0 or a.fps <= 0 or a.max_side < 64:
        p.error("Invalid time, frame rate, or size.")
    if not shutil.which("ffmpeg"):
        p.error("Install FFmpeg and make sure it is on PATH.")
    images = a.workspace / "images"
    if images.exists() and any(images.iterdir()):
        p.error("Workspace images folder is not empty; choose a fresh workspace.")
    images.mkdir(parents=True, exist_ok=True)
    size = a.max_side - a.max_side % 2
    filters = f"fps={a.fps},scale=w='min(iw,{size})':h='min(ih,{size})':force_original_aspect_ratio=decrease:force_divisible_by=2"
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin",
        "-ss", str(a.start), "-i", str(a.video.resolve()), "-t", str(a.duration),
        "-map", "0:v:0", "-vf", filters, "-an", "-start_number", "0",
        str(images / "%06d.png")
    ], check=True)
    count = len(list(images.glob("*.png")))
    if count < 8:
        raise RuntimeError(f"Only {count} frames extracted. Choose a longer clip.")
    info = dict(source=a.video.name, start_seconds=a.start,
                duration_seconds=a.duration, fps=a.fps, max_side=size, frames=count)
    (a.workspace / "capture-settings.json").write_text(json.dumps(info, indent=2)+"\n")
    print(f"Prepared {count} frames at {images}")

if __name__ == "__main__":
    main()
