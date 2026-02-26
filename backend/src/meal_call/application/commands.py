from dataclasses import dataclass, field


@dataclass
class CreateMealCallCommand:
    family_id: str
    caller_id: str
    caller_nickname: str
    all_member_ids: list[str]
    menu_item_ids: list[str] = field(default_factory=list)
    message: str | None = None


@dataclass
class RespondMealCallCommand:
    meal_call_id: str
    member_id: str
    response_type: str
    custom_message: str | None = None


@dataclass
class RemindMealCallCommand:
    meal_call_id: str
    requester_id: str


@dataclass
class CompleteMealCallCommand:
    meal_call_id: str
    requester_id: str


@dataclass
class CreateMenuItemCommand:
    family_id: str
    name: str
    emoji_icon: str = "🍽️"
    category: str = "ETC"
