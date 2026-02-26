from src.meal_call.application.commands import (
    CreateMealCallCommand, RespondMealCallCommand,
    RemindMealCallCommand, CompleteMealCallCommand, CreateMenuItemCommand,
)
from src.meal_call.application.dto import MealCallDto, MenuItemDto, MealResponseDto
from src.meal_call.domain.meal_call import MealCall
from src.meal_call.domain.menu_item import MenuItem, MenuCategory
from src.meal_call.domain.meal_response import ResponseType
from src.meal_call.domain.repository import MealCallRepository, MenuItemRepository
from src.shared.api.error_handlers import NotFoundError, DomainError
from src.shared.infrastructure.event_bus import event_bus


def _menu_dto(m: MenuItem) -> MenuItemDto:
    return MenuItemDto(
        id=m.id, family_id=m.family_id, name=m.name,
        emoji_icon=m.emoji_icon,
        category=m.category.value if hasattr(m.category, 'value') else m.category,
    )


def _response_dto(r, nickname_map: dict[str, str]) -> MealResponseDto:
    return MealResponseDto(
        id=r.id, member_id=r.member_id,
        member_nickname=nickname_map.get(r.member_id, "알 수 없음"),
        response_type=r.response_type.value if hasattr(r.response_type, 'value') else r.response_type,
        custom_message=r.custom_message,
        responded_at=r.responded_at,
    )


def _meal_call_dto(mc: MealCall, nickname_map: dict[str, str]) -> MealCallDto:
    return MealCallDto(
        id=mc.id, family_id=mc.family_id,
        caller_id=mc.caller_id,
        caller_nickname=nickname_map.get(mc.caller_id, "알 수 없음"),
        message=mc.message,
        status=mc.status.value if hasattr(mc.status, 'value') else mc.status,
        created_at=mc.created_at,
        completed_at=mc.completed_at,
        menus=[_menu_dto(m) for m in mc.menus],
        responses=[_response_dto(r, nickname_map) for r in mc.responses],
        pending_member_ids=mc.get_pending_member_ids(),
    )


class CreateMealCallHandler:
    def __init__(self, repo: MealCallRepository, menu_repo: MenuItemRepository):
        self._repo = repo
        self._menu_repo = menu_repo

    async def handle(self, cmd: CreateMealCallCommand) -> MealCallDto:
        menus = []
        for menu_id in cmd.menu_item_ids:
            item = await self._menu_repo.find_by_id(menu_id)
            if item:
                menus.append(item)

        meal_call = MealCall.create(
            family_id=cmd.family_id,
            caller_id=cmd.caller_id,
            caller_nickname=cmd.caller_nickname,
            all_member_ids=cmd.all_member_ids,
            menus=menus,
            message=cmd.message,
        )
        await self._repo.save(meal_call)
        events = meal_call.collect_events()
        await event_bus.publish_all(events)
        return _meal_call_dto(meal_call, {cmd.caller_id: cmd.caller_nickname})


class RespondMealCallHandler:
    def __init__(self, repo: MealCallRepository):
        self._repo = repo

    async def handle(self, cmd: RespondMealCallCommand) -> MealCallDto:
        meal_call = await self._repo.find_by_id(cmd.meal_call_id)
        if not meal_call:
            raise NotFoundError("밥먹자 호출", cmd.meal_call_id)

        try:
            response_type = ResponseType(cmd.response_type)
        except ValueError:
            raise DomainError(f"유효하지 않은 응답 타입: {cmd.response_type}", "INVALID_RESPONSE_TYPE")

        meal_call.respond(cmd.member_id, response_type, cmd.custom_message)
        await self._repo.save(meal_call)
        events = meal_call.collect_events()
        await event_bus.publish_all(events)
        return _meal_call_dto(meal_call, {})


class RemindMealCallHandler:
    def __init__(self, repo: MealCallRepository):
        self._repo = repo

    async def handle(self, cmd: RemindMealCallCommand) -> list[str]:
        meal_call = await self._repo.find_by_id(cmd.meal_call_id)
        if not meal_call:
            raise NotFoundError("밥먹자 호출", cmd.meal_call_id)

        pending_ids = meal_call.request_reminder(cmd.requester_id)
        events = meal_call.collect_events()
        await event_bus.publish_all(events)
        return pending_ids


class CompleteMealCallHandler:
    def __init__(self, repo: MealCallRepository):
        self._repo = repo

    async def handle(self, cmd: CompleteMealCallCommand) -> MealCallDto:
        meal_call = await self._repo.find_by_id(cmd.meal_call_id)
        if not meal_call:
            raise NotFoundError("밥먹자 호출", cmd.meal_call_id)

        meal_call.complete()
        await self._repo.save(meal_call)
        return _meal_call_dto(meal_call, {})


class GetActiveMealCallHandler:
    def __init__(self, repo: MealCallRepository):
        self._repo = repo

    async def handle(self, family_id: str) -> MealCallDto | None:
        mc = await self._repo.find_active_by_family(family_id)
        if not mc:
            return None
        return _meal_call_dto(mc, {})


class GetMealCallHandler:
    def __init__(self, repo: MealCallRepository):
        self._repo = repo

    async def handle(self, meal_call_id: str) -> MealCallDto:
        mc = await self._repo.find_by_id(meal_call_id)
        if not mc:
            raise NotFoundError("밥먹자 호출", meal_call_id)
        return _meal_call_dto(mc, {})


class CreateMenuItemHandler:
    def __init__(self, repo: MenuItemRepository):
        self._repo = repo

    async def handle(self, cmd: CreateMenuItemCommand) -> MenuItemDto:
        try:
            category = MenuCategory(cmd.category)
        except ValueError:
            category = MenuCategory.ETC

        item = MenuItem.create(
            family_id=cmd.family_id,
            name=cmd.name,
            emoji_icon=cmd.emoji_icon,
            category=category,
        )
        await self._repo.save(item)
        return _menu_dto(item)


class ListMenuItemsHandler:
    def __init__(self, repo: MenuItemRepository):
        self._repo = repo

    async def handle(self, family_id: str) -> list[MenuItemDto]:
        items = await self._repo.find_by_family(family_id)
        return [_menu_dto(i) for i in items]
