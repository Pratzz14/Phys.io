from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


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

