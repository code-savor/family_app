from dataclasses import dataclass
from datetime import datetime


@dataclass
class CreateFamilyCommand:
    family_name: str
    owner_nickname: str
    owner_pin: str  # raw 4-digit PIN


@dataclass
class JoinFamilyCommand:
    token: str
    nickname: str
    pin: str  # raw 4-digit PIN


@dataclass
class CreateInviteLinkCommand:
    family_id: str
    created_by: str  # member_id
    expires_at: datetime
    max_uses: int = 1


@dataclass
class LoginCommand:
    family_id: str
    nickname: str
    pin: str  # raw 4-digit PIN


@dataclass
class RefreshTokenCommand:
    refresh_token: str
