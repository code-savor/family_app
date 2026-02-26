from abc import ABC, abstractmethod
from src.meal_call.domain.meal_call import MealCall
from src.meal_call.domain.menu_item import MenuItem


class MealCallRepository(ABC):
    @abstractmethod
    async def save(self, meal_call: MealCall) -> None: ...

    @abstractmethod
    async def find_by_id(self, meal_call_id: str) -> MealCall | None: ...

    @abstractmethod
    async def find_active_by_family(self, family_id: str) -> MealCall | None: ...

    @abstractmethod
    async def find_by_family(self, family_id: str, limit: int = 20) -> list[MealCall]: ...


class MenuItemRepository(ABC):
    @abstractmethod
    async def save(self, menu_item: MenuItem) -> None: ...

    @abstractmethod
    async def find_by_family(self, family_id: str) -> list[MenuItem]: ...

    @abstractmethod
    async def find_by_id(self, menu_item_id: str) -> MenuItem | None: ...
