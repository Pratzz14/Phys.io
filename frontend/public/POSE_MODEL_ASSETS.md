# Pose model assets

These files are served from the same origin as the application. Camera frames
and MediaPipe inference remain on the user's device. World landmarks are sent
only to the same-origin local API for classification.

## Sources and licenses

- MediaPipe Pose Landmarker Full is the official float16 version 1 task bundle from
  `https://storage.googleapis.com/mediapipe-models/pose_landmarker/`.
  MediaPipe is licensed under Apache-2.0.

## SHA-256 manifest

```text
5134A3AAD27A58B93DA0088D431F366DA362B44E3CCFBE3462B3827A839011B1  public/mediapipe/models/pose_landmarker_full.task
```
