export const KNOWN_MEDIAPIPE_DIAGNOSTICS = [
  "OpenGL error checking is disabled",
  "Created TensorFlow Lite XNNPACK delegate for CPU",
  "Feedback manager requires a model with a single signature inference",
  "Using NORM_RECT without IMAGE_DIMENSIONS",
] as const;

export function isKnownMediaPipeDiagnostic(args: unknown[]): boolean {
  const message = args.map(String).join(" ");
  return KNOWN_MEDIAPIPE_DIAGNOSTICS.some((diagnostic) => message.includes(diagnostic));
}

export function installMediaPipeConsoleFilter(target: Pick<Console, "error" | "warn">): () => void {
  const originalError = target.error;
  const originalWarn = target.warn;

  target.error = (...args: unknown[]) => {
    if (!isKnownMediaPipeDiagnostic(args)) originalError.apply(target, args);
  };
  target.warn = (...args: unknown[]) => {
    if (!isKnownMediaPipeDiagnostic(args)) originalWarn.apply(target, args);
  };

  return () => {
    target.error = originalError;
    target.warn = originalWarn;
  };
}
