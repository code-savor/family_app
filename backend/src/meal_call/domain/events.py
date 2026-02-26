from dataclasses import dataclass
from src.shared.domain.domain_event import DomainEvent


@dataclass(frozen=True)
class MealCallCreated(DomainEvent):
    meal_call_id: str = ""
    family_id: str = ""
    caller_id: str = ""
    caller_nickname: str = ""
    message: str | None = None
    menu_names: list = None  # type: ignore

    def __post_init__(self):
        object.__setattr__(self, 'menu_names', self.menu_names or [])


@dataclass(frozen=True)
class MealResponseReceived(DomainEvent):
    meal_call_id: str = ""
    family_id: str = ""
    member_id: str = ""
    response_type: str = ""


@dataclass(frozen=True)
class ReminderRequested(DomainEvent):
    meal_call_id: str = ""
    family_id: str = ""
    requester_id: str = ""
    pending_member_ids: list = None  # type: ignore

    def __post_init__(self):
        object.__setattr__(self, 'pending_member_ids', self.pending_member_ids or [])
