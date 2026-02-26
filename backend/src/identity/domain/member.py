from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import uuid


class MemberRole(str, Enum):
    OWNER = "OWNER"
    MEMBER = "MEMBER"


@dataclass
class Member:
    id: str
    family_id: str
    nickname: str
    hashed_pin: str
    role: MemberRole
    created_at: datetime

    @classmethod
    def create(
        cls,
        family_id: str,
        nickname: str,
        hashed_pin: str,
        role: MemberRole = MemberRole.MEMBER,
    ) -> "Member":
        return cls(
            id=str(uuid.uuid4()),
            family_id=family_id,
            nickname=nickname,
            hashed_pin=hashed_pin,
            role=role,
            created_at=datetime.now(timezone.utc),
        )
