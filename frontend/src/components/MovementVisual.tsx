import type { SVGProps } from "react";
import type { GuidanceFrame, PoseVariant } from "../types";

type Point = readonly [number, number];
type Joint = "head" | "neck" | "leftShoulder" | "rightShoulder" | "leftElbow" | "rightElbow" | "leftWrist" | "rightWrist" | "leftHip" | "rightHip" | "leftKnee" | "rightKnee" | "leftAnkle" | "rightAnkle";
type Pose = Record<Joint, Point>;

interface MovementVisualProps extends SVGProps<SVGSVGElement> {
  variant?: PoseVariant;
  compact?: boolean;
}

const POSE_EDGES: ReadonlyArray<readonly [Joint, Joint]> = [
  ["neck", "leftShoulder"], ["neck", "rightShoulder"],
  ["leftShoulder", "leftElbow"], ["leftElbow", "leftWrist"],
  ["rightShoulder", "rightElbow"], ["rightElbow", "rightWrist"],
  ["neck", "leftHip"], ["neck", "rightHip"], ["leftHip", "rightHip"],
  ["leftHip", "leftKnee"], ["leftKnee", "leftAnkle"],
  ["rightHip", "rightKnee"], ["rightKnee", "rightAnkle"],
];

const POSES: Record<PoseVariant, Pose> = {
  standing: {
    head: [120, 34], neck: [120, 55], leftShoulder: [90, 75], rightShoulder: [150, 75],
    leftElbow: [72, 113], rightElbow: [168, 113], leftWrist: [63, 151], rightWrist: [177, 151],
    leftHip: [105, 126], rightHip: [135, 126], leftKnee: [101, 175], rightKnee: [139, 175],
    leftAnkle: [96, 218], rightAnkle: [144, 218],
  },
  shoulder: {
    head: [120, 34], neck: [120, 55], leftShoulder: [90, 76], rightShoulder: [150, 76],
    leftElbow: [70, 51], rightElbow: [170, 51], leftWrist: [61, 24], rightWrist: [179, 24],
    leftHip: [105, 126], rightHip: [135, 126], leftKnee: [101, 175], rightKnee: [139, 175],
    leftAnkle: [96, 218], rightAnkle: [144, 218],
  },
  back: {
    head: [76, 61], neck: [94, 78], leftShoulder: [77, 91], rightShoulder: [110, 70],
    leftElbow: [59, 120], rightElbow: [129, 96], leftWrist: [43, 149], rightWrist: [146, 119],
    leftHip: [121, 124], rightHip: [146, 133], leftKnee: [132, 171], rightKnee: [157, 180],
    leftAnkle: [142, 217], rightAnkle: [176, 219],
  },
  neck: {
    head: [108, 34], neck: [120, 56], leftShoulder: [89, 76], rightShoulder: [151, 76],
    leftElbow: [71, 114], rightElbow: [169, 114], leftWrist: [62, 151], rightWrist: [178, 151],
    leftHip: [105, 126], rightHip: [135, 126], leftKnee: [101, 175], rightKnee: [139, 175],
    leftAnkle: [96, 218], rightAnkle: [144, 218],
  },
  elbow: {
    head: [120, 34], neck: [120, 55], leftShoulder: [90, 76], rightShoulder: [150, 76],
    leftElbow: [70, 108], rightElbow: [170, 108], leftWrist: [84, 80], rightWrist: [156, 80],
    leftHip: [105, 126], rightHip: [135, 126], leftKnee: [101, 175], rightKnee: [139, 175],
    leftAnkle: [96, 218], rightAnkle: [144, 218],
  },
  knee: {
    head: [112, 34], neck: [113, 55], leftShoulder: [85, 76], rightShoulder: [143, 73],
    leftElbow: [69, 109], rightElbow: [160, 104], leftWrist: [59, 144], rightWrist: [177, 134],
    leftHip: [103, 125], rightHip: [135, 123], leftKnee: [82, 169], rightKnee: [153, 163],
    leftAnkle: [60, 210], rightAnkle: [184, 191],
  },
  ankle: {
    head: [115, 34], neck: [116, 55], leftShoulder: [86, 76], rightShoulder: [148, 76],
    leftElbow: [70, 110], rightElbow: [165, 109], leftWrist: [58, 146], rightWrist: [179, 143],
    leftHip: [103, 126], rightHip: [135, 126], leftKnee: [102, 175], rightKnee: [152, 160],
    leftAnkle: [98, 218], rightAnkle: [170, 184],
  },
};

export function MovementVisual({ variant = "standing", compact = false, className, ...props }: MovementVisualProps) {
  const pose = POSES[variant];
  const [headX, headY] = pose.head;
  const [neckX, neckY] = pose.neck;

  return (
    <svg
      className={`pose-svg${compact ? " pose-svg-compact" : ""}${className ? ` ${className}` : ""}`}
      viewBox="0 0 240 240"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <g className="pose-lines" opacity=".96">
        <circle cx={headX} cy={headY} r="13" />
        <line x1={headX} y1={headY + 13} x2={neckX} y2={neckY} />
        {POSE_EDGES.map(([from, to]) => (
          <line key={`${from}-${to}`} x1={pose[from][0]} y1={pose[from][1]} x2={pose[to][0]} y2={pose[to][1]} />
        ))}
      </g>
      <g className="pose-dots" fill="currentColor" stroke="none">
        {(Object.entries(pose) as Array<[Joint, Point]>).map(([joint, [cx, cy]]) => (
          <circle key={joint} cx={cx} cy={cy} r={compact ? 4.5 : 5} />
        ))}
      </g>
    </svg>
  );
}

export function PoseSequence({ frames }: { frames: GuidanceFrame[] }) {
  return (
    <div className="pose-sequence" aria-hidden="true">
      {frames.map((frame, index) => (
        <div className="pose-sequence-step" key={`${frame.pose}-${frame.mirrored ? "mirrored" : "regular"}-${index}`}>
          <MovementVisual variant={frame.pose} compact className={frame.mirrored ? "pose-svg-mirrored" : undefined} />
          {index < frames.length - 1 ? (
            <svg className="sequence-arrow" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m7 4 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </div>
      ))}
    </div>
  );
}
