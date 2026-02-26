from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
import uuid


class MenuCategory(str, Enum):
    KOREAN = "KOREAN"
    CHINESE = "CHINESE"
    JAPANESE = "JAPANESE"
    WESTERN = "WESTERN"
    FAST_FOOD = "FAST_FOOD"
    SNACK = "SNACK"
    ETC = "ETC"


@dataclass
class MenuItem:
    id: str
    family_id: str
    name: str
    emoji_icon: str
    category: MenuCategory
    created_at: datetime

    @classmethod
    def create(
        cls,
        family_id: str,
        name: str,
        emoji_icon: str = "🍽️",
        category: MenuCategory = MenuCategory.ETC,
    ) -> "MenuItem":
        return cls(
            id=str(uuid.uuid4()),
            family_id=family_id,
            name=name,
            emoji_icon=emoji_icon,
            category=category,
            created_at=datetime.now(timezone.utc),
        )
