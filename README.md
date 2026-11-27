# Spatial Graffiti Study 001

LifeAfterLogic's first browser experiment for a rotating collection of spatial graffiti scenes.

## Visual reference

The target visual language is based on the user-supplied 4D Gaussian-splat videos and the original creator reference, [@baaak3 on Instagram](https://www.instagram.com/baaak3/). The Instagram page could not be fetched directly in this session; the attached MP4s were inspected as the primary visual reference.

## Current build

The page now renders **real Gaussian splat captures** through the Luma Web SDK and Three.js. The captures are loaded as 3D scene objects in one shared world — they are not video textures, image cards, or CSS panels.

- Six independent splat scenes arranged around a horizontal orbit
- Slightly offset starting camera and different scene heights / tilts
- Slow automatic rotation of the complete scene group
- Mouse / touch orbit, zoom and pan
- Black environment with no rectangular scene frames

## Important limitation

The current public test assets are **static 3D Gaussian captures of street-art locations** by @Volt_Edge, used only to validate the real splat renderer and spatial composition. They are not moving graffiti artists and are not 4D reconstructions.

The intended final artwork is a set of dynamic 4D Gaussian reconstructions of graffiti artists tagging walls. That requires original source footage or exported per-frame 4D Gaussian data. A rendered MP4 reference is not the underlying Gaussian scene data and cannot be converted back into the original splats.

## Temporary public test captures

- [Faraday Street / Bentoghoul](https://lumalabs.ai/capture/3582f3b0-565e-443f-9165-3571c0721fbc)
- [Stevenson Place / July](https://lumalabs.ai/capture/1a487b86-38a7-466d-856b-5d9ad2f84fab)
- [Faraday Street / June](https://lumalabs.ai/capture/b101171b-cf5f-4669-ab44-d9fa39e69898)
- [Graffiti Palace / Lamp post](https://lumalabs.ai/capture/9c6e8bac-3b79-4f39-a605-58999d33c33c)
- [Faraday Street / April](https://lumalabs.ai/capture/94f2efd7-f65d-4b7f-b455-536e95643bad)
- [STIK Door / Brick Lane](https://lumalabs.ai/capture/3adabd81-8ef0-4257-92cb-a2929ef8aa8a)

All temporary captures are credited to @Volt_Edge. Replace them with LifeAfterLogic's own licensed 4D graffiti captures before any final studio launch.

## Rendering stack

- Three.js
- @lumaai/luma-web for public Luma Gaussian capture loading
- GitHub Pages for static hosting

## Next stage

1. Obtain or shoot a short continuous clip of a graffiti artist tagging a wall.
2. Reconstruct the clip into temporally consistent 3D points / Gaussian data.
3. Export a compact per-frame or 4D splat sequence.
4. Replace the temporary static captures with those dynamic scene assets.
5. Keep the same shared orbit, with the splat data animating independently in each scene.

## 4D Splat Studio

Open the [4D Splat Studio viewer](https://tmoreno-01.github.io/gaussian/ring-studio.html) to load multiple original `*_full_vda.zip` reconstructions at once.

- Each reconstruction is rendered as its own animated 4D depth splat.
- Scenes are arranged in a slowly rotating ring by default.
- Each scene has an independent scale control; scenes can be hidden or isolated.
- The viewer supports standard ZIP and ZIP64 archives and decodes frames locally.
- Render a 360-degree MP4 loop at landscape, square or portrait sizes. MP4 encoding uses Mediabunny and the browser's WebCodecs support; source ZIPs remain on the user's device.
