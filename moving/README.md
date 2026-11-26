# Matter of Perspective — moving research

Static v.01 is preserved on the static-v01 branch, and the studio production website is unchanged. This branch is for dynamic reconstruction only.

## Visual target

Keep the original black backdrop, six floating urban fragments, spacing, scales, orbit and unrestricted camera controls. Replace one static capture at a time with a genuine time-varying Gaussian reconstruction. Time and viewpoint must be independently controllable. No billboards, animated image planes, or fabricated depth motion presented as reconstruction.

## First capture

Download one continuous clip from sources.json, inspect it for cuts, motion blur and enough visible background. Prefer a short landscape section with the artist and wall in frame, and slight camera translation (parallax). The list is a shortlist based on published descriptions; the clips have not yet been decoded or assessed frame-by-frame.

Start with 5 seconds at 12 frames/s, max dimension 768, on an NVIDIA CUDA-capable machine. Increase the temporal and spatial sampling after testing. The 24 GB RTX 3090 is a plausible starting point, not a verified memory budget.

## Local reconstruction

Use Ubuntu or WSL2 with NVIDIA CUDA access and the upstream MoSca installation instructions: https://github.com/JiahuiLei/MoSca

The upstream setup assumes CUDA 11.8 and Anaconda. Check all dependency and checkpoint licenses before commercial deployment; MoSca's MIT grant does not cover all third-party code/models. Test the upstream duck demo before custom clips.

1. Clone MoSca separately and follow its install/weights instructions.
2. From this repo, prepare an image sequence in the MoSca workspace:

   python3 moving/prepare_clip.py /path/to/graffiti.mp4 /path/to/MoSca/demo/graffiti --start 0 --duration 5 --fps 12 --max-side 768

3. In the MoSca directory with its environment active:

   python mosca_precompute.py --cfg ./profile/demo/demo_prep.yaml --ws ./demo/graffiti
   python mosca_reconstruct.py --cfg ./profile/demo/demo_fit.yaml --ws ./demo/graffiti

4. Inspect the reconstructed scene in source and novel camera views. Keep the model/checkpoints, camera data, and preview outputs. Do not send just an MP4; it cannot supply interactive 4D geometry.
5. Next engineering step: implement an exporter from the successful model to a temporally coherent Gaussian stream, and connect a browser decoder to the original composition. MoSca does not ship a ready-made browser export in these commands.

## Alternatives

Shape of Motion: https://github.com/vye16/shape-of-motion — custom video support with preprocessing of depth, camera and tracks. StreamSplat: https://github.com/DSL-Lab/StreamSplat — feed-forward dynamic reconstruction, requires checking real custom-video inference and checkpoint terms. Explore these if MoSca produces poor geometry or runs out of memory.

## Acceptance checks

- One short scene plays with real motion and parallax from independently controlled camera angles.
- Static background remains coherent; person and wall do not flicker or smear excessively.
- Preserve the black surround and fragment edges. No quality changes to static v.01.
- Measure GPU memory during reconstruction; benchmark file size, decoding, frame time and GPU memory before adding further scenes.
- No studio production changes until explicitly approved.

Status: source candidates and frame preparation ready. Reconstruction and browser playback have not yet been run.
