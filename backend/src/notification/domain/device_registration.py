from dataclasses import dataclass
from datetime import datetime, timezone
import uuid


@dataclass
class DeviceRegistration:
    id: str
    member_id: str
    expo_push_token: str
    registered_at: datetime

    @classmethod
    def create(cls, member_id: str, expo_push_token: str) -> "DeviceRegistration":
        return cls(
            id=str(uuid.uuid4()),
            member_id=member_id,
            expo_push_token=expo_push_token,
            registered_at=datetime.now(timezone.utc),
        )
