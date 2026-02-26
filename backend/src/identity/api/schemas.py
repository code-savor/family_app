from pydantic import BaseModel, field_validator
from datetime import datetime


# --- Request ---

class CreateFamilyRequest(BaseModel):
    family_name: str
    owner_nickname: str
    owner_pin: str

    @field_validator("owner_pin")
    @classmethod
    def pin_must_be_4_digits(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 4:
            raise ValueError("PIN은 4자리 숫자여야 합니다")
        return v


class JoinFamilyRequest(BaseModel):
    nickname: str
    pin: str

    @field_validator("pin")
    @classmethod
    def pin_must_be_4_digits(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 4:
            raise ValueError("PIN은 4자리 숫자여야 합니다")
        return v


class CreateInviteLinkRequest(BaseModel):
    expires_at: datetime
    max_uses: int = 1


class LoginRequest(BaseModel):
    family_id: str
    nickname: str
    pin: str

    @field_validator("pin")
    @classmethod
    def pin_must_be_4_digits(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 4:
            raise ValueError("PIN은 4자리 숫자여야 합니다")
        return v


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# --- Response ---

class MemberResponse(BaseModel):
    id: str
    family_id: str
    nickname: str
    role: str
    created_at: datetime


class FamilyResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    members: list[MemberResponse]


class InviteLinkResponse(BaseModel):
    id: str
    family_id: str
    token: str
    expires_at: datetime
    max_uses: int
    used_count: int
    invite_url: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    member: MemberResponse | None = None
