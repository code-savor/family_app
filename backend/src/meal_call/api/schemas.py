from pydantic import BaseModel
from datetime import datetime


# --- Request ---

class CreateMenuItemRequest(BaseModel):
    name: str
    emoji_icon: str = "🍽️"
    category: str = "ETC"


class CreateMealCallRequest(BaseModel):
    menu_item_ids: list[str] = []
    message: str | None = None


class RespondMealCallRequest(BaseModel):
    response_type: str   # COMING_NOW | COMING_5MIN | NOT_EATING | CUSTOM
    custom_message: str | None = None


# --- Response ---

class MenuItemResponse(BaseModel):
    id: str
    family_id: str
    name: str
    emoji_icon: str
    category: str


class MealResponseResponse(BaseModel):
    id: str
    member_id: str
    member_nickname: str
    response_type: str
    custom_message: str | None
    responded_at: datetime


class MealCallResponse(BaseModel):
    id: str
    family_id: str
    caller_id: str
    caller_nickname: str
    message: str | None
    status: str
    created_at: datetime
    completed_at: datetime | None
    menus: list[MenuItemResponse]
    responses: list[MealResponseResponse]
    pending_member_ids: list[str]


class ReminderResponse(BaseModel):
    pending_member_ids: list[str]
    message: str
