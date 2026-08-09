import type { Exercise } from "../types";

export const exercises: Exercise[] = [
  {
    id: "hands-up-down",
    title: "Hands Up / Hands Down",
    description: "Raise and lower both arms with control",
    area: "Shoulder",
    accent: "sage",
    mode: "live",
    classifier: {
      modelId: "hands-up-vs-down.joblib",
      endpoints: [
        { classLabel: "Hands Up", displayLabel: "Up" },
        { classLabel: "Hands Down", displayLabel: "Down" },
      ],
    },
  },
  {
    id: "hands-side-up",
    title: "Hands Side / Hands Up",
    description: "Move both arms from shoulder height to overhead",
    area: "Shoulder",
    accent: "coral",
    mode: "live",
    classifier: {
      modelId: "hands-side-vs-up.joblib",
      endpoints: [
        { classLabel: "Hands Side", displayLabel: "Side" },
        { classLabel: "Hands Up", displayLabel: "Up" },
      ],
    },
  },
  {
    id: "neck-release",
    title: "Neck release",
    description: "Gentle neck movement",
    area: "Neck",
    accent: "blue",
    mode: "guidance",
    videoUrl: "https://www.youtube.com/embed/iwPsbH5yFc4",
    guidance: {
      intro: "Move through a small, comfortable range. Keep your shoulders relaxed and return to center between sides.",
      frames: [{ pose: "standing" }, { pose: "neck" }, { pose: "standing" }, { pose: "neck", mirrored: true }, { pose: "standing" }],
      steps: [
        { title: "Set a tall posture", description: "Sit or stand tall, keep your gaze forward, and relax your shoulders." },
        { title: "Tilt to one side", description: "Bring one ear gently toward the same-side shoulder without raising the shoulder." },
        { title: "Return and change sides", description: "Come back to center, pause, then repeat toward the other shoulder." },
      ],
      checklist: [
        "Keep your chin level and shoulders relaxed.",
        "Use a small, comfortable range.",
        "Stop if movement causes dizziness, tingling, or sharp pain.",
      ],
    },
  },
  {
    id: "elbow-flow",
    title: "Elbow flow",
    description: "Elbow mobility",
    area: "Elbow",
    accent: "lavender",
    mode: "guidance",
    videoUrl: "https://www.youtube.com/embed/Lf695_IJO8g",
    guidance: {
      intro: "Keep your upper arm steady while the elbow bends and straightens through a comfortable range.",
      frames: [{ pose: "standing" }, { pose: "elbow" }, { pose: "standing" }, { pose: "elbow" }, { pose: "standing" }],
      steps: [
        { title: "Set your upper arm", description: "Sit or stand tall with your upper arm close to your side." },
        { title: "Bend the elbow", description: "Bring your hand toward your shoulder without lifting the upper arm." },
        { title: "Straighten with control", description: "Lower the forearm slowly and stop before the elbow feels forced." },
      ],
      checklist: [
        "Keep your shoulder relaxed and upper arm still.",
        "Move only through a comfortable range.",
        "Reduce the range if pain increases.",
      ],
    },
  },
  {
    id: "knee-control",
    title: "Knee control",
    description: "Stable knee movement",
    area: "Knee",
    accent: "sand",
    mode: "guidance",
    videoUrl: "https://www.youtube.com/embed/pOrc3zADC7k",
    guidance: {
      intro: "Practice a shallow, controlled knee bend with steady feet and a stable support within reach.",
      frames: [{ pose: "standing" }, { pose: "knee" }, { pose: "standing" }, { pose: "knee", mirrored: true }, { pose: "standing" }],
      steps: [
        { title: "Set your stance", description: "Stand with feet about shoulder-width apart and keep a stable support nearby." },
        { title: "Lower with control", description: "Keep your chest lifted and send your hips slightly back as both knees bend." },
        { title: "Return to standing", description: "Press through your feet and straighten gradually without locking the knees." },
      ],
      checklist: [
        "Keep both feet planted and knees tracking over the feet.",
        "Use a chair or wall for balance if needed.",
        "Stop if you feel sharp pain or instability.",
      ],
    },
  },
  {
    id: "ankle-mobility",
    title: "Ankle mobility",
    description: "Controlled ankle movement",
    area: "Ankle",
    accent: "sage",
    mode: "guidance",
    videoUrl: "https://www.youtube.com/embed/hEmLp6iQB7M",
    guidance: {
      intro: "Use a stable support while you shift weight and lift one foot with control.",
      frames: [{ pose: "standing" }, { pose: "ankle" }, { pose: "standing" }, { pose: "ankle", mirrored: true }, { pose: "standing" }],
      steps: [
        { title: "Set up beside support", description: "Stand tall next to a sturdy chair or counter with both feet grounded." },
        { title: "Shift and lift", description: "Move your weight onto one leg, then lift the other foot a small distance." },
        { title: "Lower with control", description: "Place the foot down softly, reset your balance, and change sides." },
      ],
      checklist: [
        "Keep a stable support within reach.",
        "Use a level, non-slip surface.",
        "Stop if you feel pain or cannot balance safely.",
      ],
    },
  },
];
