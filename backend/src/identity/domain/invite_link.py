from dataclasses import dataclass
from datetime import datetime, timezone
import uuid
import secrets


@dataclass
class InviteLink:
    id: str
    family_id: str
    token: str
    expires_at: datetime
    max_uses: int
    used_count: int
    created_by: str  # member_id

    @classmethod
    def create(
        cls,
        family_id: str,
        created_by: str,
        expires_at: datetime,
        max_uses: int = 1,
    ) -> "InviteLink":
        return cls(
            id=str(uuid.uuid4()),
            family_id=family_id,
            token=secrets.token_urlsafe(16),
            expires_at=expires_at,
            max_uses=max_uses,
            used_count=0,
            created_by=created_by,
        )

    def is_valid(self) -> bool:
        now = datetime.now(timezone.utc)
        expires = self.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        return expires > now and self.used_count < self.max_uses

    def use(self) -> None:
        if not self.is_valid():
            raise ValueError("초대 링크가 만료되었거나 사용 횟수를 초과했습니다")
        self.used_count += 1
