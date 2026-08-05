# Legacy pose runtime

The browser monitor intentionally uses the original compatible runtime:

- p5.js 1.2.0
- ml5.js 0.5.0-compatible bundle

The bundled classifiers were trained against the legacy PoseNet and ml5 neural-network APIs. Do not update either file independently. A future migration must move both libraries and retrain or validate the classifiers against ml5 BodyPose before replacing these files.
