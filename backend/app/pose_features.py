from __future__ import annotations

import math

import numpy as np


POSE_FEATURE_JOINTS = (0, *range(11, 33))
ANGLE_TRIPLES = (
    (11, 13, 15), (12, 14, 16),
    (13, 11, 23), (14, 12, 24),
    (11, 23, 25), (12, 24, 26),
    (23, 25, 27), (24, 26, 28),
    (25, 27, 31), (26, 28, 32),
)
FEATURE_COUNT = len(POSE_FEATURE_JOINTS) * 3 + len(ANGLE_TRIPLES)


def _unit(vector: np.ndarray) -> np.ndarray | None:
    magnitude = float(np.linalg.norm(vector))
    return vector / magnitude if magnitude > 1e-8 else None


def _angle(points: np.ndarray, first: int, middle: int, last: int, threshold: float) -> float:
    if np.any(~np.isfinite(points[[first, middle, last], :3])):
        return np.nan
    confidence = points[[first, middle, last], 3:5]
    if np.any(~np.isfinite(confidence)) or np.min(confidence) < threshold:
        return np.nan
    left = _unit(points[first, :3] - points[middle, :3])
    right = _unit(points[last, :3] - points[middle, :3])
    if left is None or right is None:
        return np.nan
    return float(math.acos(float(np.clip(np.dot(left, right), -1, 1))))


def extract_features(landmarks: np.ndarray | None, threshold: float) -> np.ndarray:
    feature = np.full(FEATURE_COUNT, np.nan, dtype=float)
    if landmarks is None:
        return feature
    required = (11, 12, 23, 24)
    if np.any(~np.isfinite(landmarks[list(required), :3])):
        return feature
    if np.any(~np.isfinite(landmarks[list(required), 3:5])):
        return feature
    if float(np.min(landmarks[list(required), 3:5])) < threshold:
        return feature

    pelvis = (landmarks[23, :3] + landmarks[24, :3]) / 2
    shoulders = (landmarks[11, :3] + landmarks[12, :3]) / 2
    up = _unit(shoulders - pelvis)
    lateral_seed = _unit((landmarks[11, :3] - landmarks[12, :3] + landmarks[23, :3] - landmarks[24, :3]) / 2)
    if up is None or lateral_seed is None:
        return feature
    forward = _unit(np.cross(lateral_seed, up))
    lateral = _unit(np.cross(up, forward)) if forward is not None else None
    scale = float(np.linalg.norm(shoulders - pelvis))
    if lateral is None or scale < 1e-8:
        return feature
    basis = np.stack((lateral, up, forward), axis=1)

    position = 0
    for joint in POSE_FEATURE_JOINTS:
        confidence = landmarks[joint, 3:5]
        if np.all(np.isfinite(landmarks[joint, :3])) and np.all(np.isfinite(confidence)) and float(np.min(confidence)) >= threshold:
            feature[position:position + 3] = ((landmarks[joint, :3] - pelvis) @ basis) / scale
        position += 3
    for first, middle, last in ANGLE_TRIPLES:
        feature[position] = _angle(landmarks, first, middle, last, threshold)
        position += 1
    return feature
