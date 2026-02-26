from dataclasses import dataclass
from datetime import datetime


@dataclass
class MemberDto:
    id: str
    family_id: str
    nickname: str
    role: str
    created_at: datetime


@dataclass
class FamilyDto:
    id: str
    name: str
    created_at: datetime
    members: list[MemberDto]


@dataclass
class InviteLinkDto:
    id: str
    family_id: str
    token: str
    expires_at: datetime
    max_uses: int
    used_count: int


@dataclass
class AuthTokenDto:
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    member: MemberDto | None = None
