from __future__ import annotations

from datetime import datetime
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class RegisterRequest(BaseModel):
    name: str = Field(min_length=3, max_length=80)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    confirm_password: str = Field(min_length=12, max_length=128)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value or any(char.isspace() for char in value):
            raise ValueError("Username must not contain whitespace")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fullname: str = Field(default="", max_length=120)
    phone: str = Field(default="", max_length=40)
    age: int = Field(default=0, ge=0, le=120)
    weight: int = Field(default=0, ge=0, le=500)
    height: int = Field(default=0, ge=0, le=300)
    gender: Literal["male", "female", "other", "unspecified"] = "unspecified"
    specify: str = Field(default="", max_length=1000)
    neck_pain: int = Field(default=0, ge=0, le=50)
    shoulder_pain: int = Field(default=0, ge=0, le=50)
    elbow_pain: int = Field(default=0, ge=0, le=50)
    back_pain: int = Field(default=0, ge=0, le=50)
    knee_pain: int = Field(default=0, ge=0, le=50)
    ankle_pain: int = Field(default=0, ge=0, le=50)


class ProfileResponse(ProfileUpdate):
    user_id: str
    name: str
    email: EmailStr
    image_url: str | None = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr


class AuthResponse(BaseModel):
    user: UserResponse
    csrf_token: str


class CsrfResponse(BaseModel):
    csrf_token: str


class HealthResponse(BaseModel):
    status: str
    database: str


class ClassifierLandmark(BaseModel):
    model_config = ConfigDict(extra="forbid")

    x: float | None = None
    y: float | None = None
    z: float | None = None
    visibility: float | None = None
    presence: float | None = None


class ClassifierPredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    world_landmarks: list[ClassifierLandmark] = Field(min_length=33, max_length=33)


class ExerciseSessionUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    exercise_id: Literal["hands-up-down", "hands-side-up"]
    started_at: datetime
    last_active_at: datetime
    active_seconds: int = Field(ge=0, le=86_400)
    repetitions: int = Field(ge=1, le=100_000)
    average_accuracy: float = Field(ge=0, le=100)
    accuracy_sample_count: int = Field(ge=1, le=10_000_000)
    revision: int = Field(ge=1, le=2_147_483_647)

    @model_validator(mode="after")
    def validate_timeline(self) -> Self:
        if self.started_at.tzinfo is None or self.started_at.utcoffset() is None:
            raise ValueError("started_at must include a timezone")
        if self.last_active_at.tzinfo is None or self.last_active_at.utcoffset() is None:
            raise ValueError("last_active_at must include a timezone")
        elapsed_seconds = (self.last_active_at - self.started_at).total_seconds()
        if elapsed_seconds < 0:
            raise ValueError("last_active_at must not be before started_at")
        if self.active_seconds > elapsed_seconds + 1:
            raise ValueError("active_seconds cannot exceed elapsed session time")
        return self


class ExerciseSessionResponse(ExerciseSessionUpdate):
    session_id: str
