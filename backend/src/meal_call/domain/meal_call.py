from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import uuid

from src.shared.domain.aggregate_root import AggregateRoot
from src.meal_call.domain.meal_response import MealResponse, ResponseType
from src.meal_call.domain.menu_item import MenuItem
from src.meal_call.domain.events import (
    MealCallCreated, MealResponseReceived, ReminderRequested,
)


class MealCallStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


@dataclass
class MealCall(AggregateRoot):
    id: str
    family_id: str
    caller_id: str
    message: str | None
    status: MealCallStatus
    created_at: datetime
    completed_at: datetime | None
    menus: list[MenuItem] = field(default_factory=list)
    responses: list[MealResponse] = field(default_factory=list)
    all_member_ids: list[str] = field(default_factory=list)  # 생성 시점 가족 구성원

    def __post_init__(self):
        super().__init__()

    @classmethod
    def create(
        cls,
        family_id: str,
        caller_id: str,
        caller_nickname: str,
        all_member_ids: list[str],
        menus: list[MenuItem] | None = None,
        message: str | None = None,
    ) -> "MealCall":
        meal_call = cls(
            id=str(uuid.uuid4()),
            family_id=family_id,
            caller_id=caller_id,
            message=message,
            status=MealCallStatus.ACTIVE,
            created_at=datetime.now(timezone.utc),
            completed_at=None,
            menus=menus or [],
            responses=[],
            all_member_ids=all_member_ids,
        )
        meal_call._add_event(
            MealCallCreated(
                meal_call_id=meal_call.id,
                family_id=family_id,
                caller_id=caller_id,
                caller_nickname=caller_nickname,
                message=message,
                menu_names=[m.name for m in (menus or [])],
            )
        )
        return meal_call

    def respond(
        self,
        member_id: str,
        response_type: ResponseType,
        custom_message: str | None = None,
    ) -> MealResponse:
        if self.status != MealCallStatus.ACTIVE:
            raise ValueError("이미 종료된 밥먹자 호출입니다")

        # 기존 응답 있으면 교체
        self.responses = [r for r in self.responses if r.member_id != member_id]
        response = MealResponse.create(
            meal_call_id=self.id,
            member_id=member_id,
            response_type=response_type,
            custom_message=custom_message,
        )
        self.responses.append(response)
        self._add_event(
            MealResponseReceived(
                meal_call_id=self.id,
                family_id=self.family_id,
                member_id=member_id,
                response_type=response_type.value,
            )
        )
        return response

    def request_reminder(self, requester_id: str) -> list[str]:
        if self.status != MealCallStatus.ACTIVE:
            raise ValueError("이미 종료된 밥먹자 호출입니다")
        pending_ids = self.get_pending_member_ids()
        self._add_event(
            ReminderRequested(
                meal_call_id=self.id,
                family_id=self.family_id,
                requester_id=requester_id,
                pending_member_ids=pending_ids,
            )
        )
        return pending_ids

    def complete(self) -> None:
        self.status = MealCallStatus.COMPLETED
        self.completed_at = datetime.now(timezone.utc)

    def cancel(self) -> None:
        self.status = MealCallStatus.CANCELLED
        self.completed_at = datetime.now(timezone.utc)

    def get_pending_member_ids(self) -> list[str]:
        responded_ids = {r.member_id for r in self.responses}
        return [mid for mid in self.all_member_ids if mid not in responded_ids]

    def is_active(self) -> bool:
        return self.status == MealCallStatus.ACTIVE
