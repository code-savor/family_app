from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class MenuItemDto:
    id: str
    family_id: str
    name: str
    emoji_icon: str
    category: str


@dataclass
class MealResponseDto:
    id: str
    member_id: str
    member_nickname: str
    response_type: str
    custom_message: str | None
    responded_at: datetime


@dataclass
class MealCallDto:
    id: str
    family_id: str
    caller_id: str
    caller_nickname: str
    message: str | None
    status: str
    created_at: datetime
    completed_at: datetime | None
    menus: list[MenuItemDto] = field(default_factory=list)
    responses: list[MealResponseDto] = field(default_factory=list)
    pending_member_ids: list[str] = field(default_factory=list)
