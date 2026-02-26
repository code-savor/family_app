from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
import uuid


class ResponseType(str, Enum):
    COMING_NOW = "COMING_NOW"       # 🏃 지금 바로 가요
    COMING_5MIN = "COMING_5MIN"     # ⏰ 5분 뒤에
    NOT_EATING = "NOT_EATING"       # 🙅 안먹을래요
    CUSTOM = "CUSTOM"               # 자유 입력


@dataclass
class MealResponse:
    id: str
    meal_call_id: str
    member_id: str
    response_type: ResponseType
    custom_message: str | None
    responded_at: datetime

    @classmethod
    def create(
        cls,
        meal_call_id: str,
        member_id: str,
        response_type: ResponseType,
        custom_message: str | None = None,
    ) -> "MealResponse":
        return cls(
            id=str(uuid.uuid4()),
            meal_call_id=meal_call_id,
            member_id=member_id,
            response_type=response_type,
            custom_message=custom_message,
            responded_at=datetime.now(timezone.utc),
        )
