# Self-hosted MediaPipe assets

- Runtime: `@mediapipe/tasks-vision` 1.0.0. The classic `vision_bundle.js` and
  matching `wasm/` directory are copied from the package so the browser does not
  fetch executable assets from a CDN.
- Model: Google MediaPipe Pose Landmarker Full (`float16/1`).
- Model sources, versions, licenses, and SHA-256 checksums are recorded in
  [`../POSE_MODEL_ASSETS.md`](../POSE_MODEL_ASSETS.md).

When upgrading `@mediapipe/tasks-vision`, replace the copied WASM files with the
matching files from the newly pinned package version.
