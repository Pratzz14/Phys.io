from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np

from .pose_features import FEATURE_COUNT, extract_features


ALLOWED_MODELS = frozenset({"hands-up-vs-down.joblib", "hands-side-vs-up.joblib"})


def _probabilities(model: Any, features: np.ndarray) -> np.ndarray:
    if hasattr(model, "predict_proba"):
        return np.asarray(model.predict_proba(features), dtype=float)
    decision = np.asarray(model.decision_function(features), dtype=float)
    if decision.ndim == 1:
        positive = 1.0 / (1.0 + np.exp(-np.clip(decision, -40, 40)))
        return np.column_stack((1.0 - positive, positive))
    shifted = decision - decision.max(axis=1, keepdims=True)
    exponent = np.exp(shifted)
    return exponent / exponent.sum(axis=1, keepdims=True)


@dataclass
class LoadedClassifier:
    pipeline: Any
    metadata: dict[str, Any]
    modified_ns: int


class ClassifierRegistry:
    def __init__(self, artifact_dir: Path) -> None:
        self.artifact_dir = artifact_dir
        self._cache: dict[str, LoadedClassifier] = {}

    def _artifact_path(self, model_id: str) -> Path:
        if model_id not in ALLOWED_MODELS or Path(model_id).name != model_id:
            raise ValueError("Classifier model is not allowed.")
        return self.artifact_dir / model_id

    def _load(self, model_id: str) -> LoadedClassifier:
        path = self._artifact_path(model_id)
        if not path.is_file():
            raise FileNotFoundError(model_id)
        modified_ns = path.stat().st_mtime_ns
        cached = self._cache.get(model_id)
        if cached and cached.modified_ns == modified_ns:
            return cached
        payload = joblib.load(path)
        if not isinstance(payload, dict) or "pipeline" not in payload or not isinstance(payload.get("metadata"), dict):
            raise ValueError("Classifier artifact is invalid.")
        loaded = LoadedClassifier(payload["pipeline"], payload["metadata"], modified_ns)
        self._cache[model_id] = loaded
        return loaded

    def predict(self, model_id: str, landmarks: list[dict[str, Any]]) -> dict[str, Any]:
        loaded = self._load(model_id)
        values = np.full((33, 5), np.nan, dtype=float)
        for index, landmark in enumerate(landmarks[:33]):
            for value_index, key in enumerate(("x", "y", "z", "visibility", "presence")):
                value = landmark.get(key)
                if isinstance(value, (int, float)) and math.isfinite(value):
                    values[index, value_index] = float(value)

        metadata = loaded.metadata
        threshold = float(metadata.get("visibilityThreshold", 0.2))
        feature = extract_features(values, threshold)
        coverage = float(np.count_nonzero(np.isfinite(feature)) / FEATURE_COUNT)
        minimum_coverage = float(metadata.get("minimumFeatureCoverage", 0.6))
        classes = [str(value) for value in metadata.get("classes", [])]
        result: dict[str, Any] = {
            "modelId": model_id,
            "classes": classes,
            "valid": False,
            "featureCoverage": coverage,
            "label": None,
            "confidence": None,
            "probabilities": {},
        }
        if len(classes) != 2 or coverage < minimum_coverage:
            return result

        probabilities = _probabilities(loaded.pipeline, feature.reshape(1, -1))[0]
        probability_map = {classes[index]: float(probabilities[index]) for index in range(len(classes))}
        winner = int(np.argmax(probabilities))
        result.update({
            "valid": True,
            "label": classes[winner],
            "confidence": float(probabilities[winner]),
            "probabilities": probability_map,
        })
        return result
