from fastapi import APIRouter, Depends

from src.meal_call.api.schemas import (
    CreateMenuItemRequest, CreateMealCallRequest, RespondMealCallRequest,
    MenuItemResponse, MealCallResponse, ReminderResponse,
)
from src.meal_call.application.commands import (
    CreateMealCallCommand, RespondMealCallCommand,
    RemindMealCallCommand, CompleteMealCallCommand, CreateMenuItemCommand,
)
from src.meal_call.application.command_handlers import (
    CreateMealCallHandler, RespondMealCallHandler,
    RemindMealCallHandler, CompleteMealCallHandler,
    GetActiveMealCallHandler, GetMealCallHandler,
    CreateMenuItemHandler, ListMenuItemsHandler,
)
from src.meal_call.infrastructure.sqlite_meal_call_repo import (
    SqliteMealCallRepository, SqliteMenuItemRepository,
)
from src.identity.infrastructure.sqlite_family_repo import SqliteFamilyRepository
from src.shared.api.dependencies import get_current_user, CurrentUser

router = APIRouter(tags=["meal-call"])


def _meal_repo(): return SqliteMealCallRepository()
def _menu_repo(): return SqliteMenuItemRepository()
def _family_repo(): return SqliteFamilyRepository()


def _to_response(dto) -> MealCallResponse:
    from src.meal_call.api.schemas import MealResponseResponse, MenuItemResponse as MIR
    return MealCallResponse(
        id=dto.id, family_id=dto.family_id,
        caller_id=dto.caller_id, caller_nickname=dto.caller_nickname,
        message=dto.message, status=dto.status,
        created_at=dto.created_at, completed_at=dto.completed_at,
        menus=[MIR(id=m.id, family_id=m.family_id, name=m.name,
                   emoji_icon=m.emoji_icon, category=m.category)
               for m in dto.menus],
        responses=[MealResponseResponse(
            id=r.id, member_id=r.member_id, member_nickname=r.member_nickname,
            response_type=r.response_type, custom_message=r.custom_message,
            responded_at=r.responded_at,
        ) for r in dto.responses],
        pending_member_ids=dto.pending_member_ids,
    )


# --- 메뉴 ---

@router.get("/menus", response_model=list[MenuItemResponse])
async def list_menus(current_user: CurrentUser = Depends(get_current_user)):
    handler = ListMenuItemsHandler(_menu_repo())
    items = await handler.handle(current_user.family_id)
    return [MenuItemResponse(id=i.id, family_id=i.family_id, name=i.name,
                              emoji_icon=i.emoji_icon, category=i.category)
            for i in items]


@router.post("/menus", response_model=MenuItemResponse, status_code=201)
async def create_menu(
    body: CreateMenuItemRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    handler = CreateMenuItemHandler(_menu_repo())
    item = await handler.handle(CreateMenuItemCommand(
        family_id=current_user.family_id,
        name=body.name,
        emoji_icon=body.emoji_icon,
        category=body.category,
    ))
    return MenuItemResponse(id=item.id, family_id=item.family_id, name=item.name,
                            emoji_icon=item.emoji_icon, category=item.category)


# --- 밥먹자 ---

@router.post("/meal-calls", response_model=MealCallResponse, status_code=201)
async def create_meal_call(
    body: CreateMealCallRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    # 가족 구성원 목록 조회
    family = await _family_repo().find_by_id(current_user.family_id)
    all_member_ids = [m.id for m in family.members] if family else []

    handler = CreateMealCallHandler(_meal_repo(), _menu_repo())
    dto = await handler.handle(CreateMealCallCommand(
        family_id=current_user.family_id,
        caller_id=current_user.member_id,
        caller_nickname=current_user.nickname,
        all_member_ids=all_member_ids,
        menu_item_ids=body.menu_item_ids,
        message=body.message,
    ))
    return _to_response(dto)


@router.get("/meal-calls/active", response_model=MealCallResponse | None)
async def get_active_meal_call(current_user: CurrentUser = Depends(get_current_user)):
    handler = GetActiveMealCallHandler(_meal_repo())
    dto = await handler.handle(current_user.family_id)
    return _to_response(dto) if dto else None


@router.get("/meal-calls/{meal_call_id}", response_model=MealCallResponse)
async def get_meal_call(
    meal_call_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    handler = GetMealCallHandler(_meal_repo())
    dto = await handler.handle(meal_call_id)
    return _to_response(dto)


@router.post("/meal-calls/{meal_call_id}/respond", response_model=MealCallResponse)
async def respond_meal_call(
    meal_call_id: str,
    body: RespondMealCallRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    handler = RespondMealCallHandler(_meal_repo())
    dto = await handler.handle(RespondMealCallCommand(
        meal_call_id=meal_call_id,
        member_id=current_user.member_id,
        response_type=body.response_type,
        custom_message=body.custom_message,
    ))
    return _to_response(dto)


@router.post("/meal-calls/{meal_call_id}/remind", response_model=ReminderResponse)
async def remind_meal_call(
    meal_call_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    handler = RemindMealCallHandler(_meal_repo())
    pending_ids = await handler.handle(RemindMealCallCommand(
        meal_call_id=meal_call_id,
        requester_id=current_user.member_id,
    ))
    return ReminderResponse(
        pending_member_ids=pending_ids,
        message=f"미응답 {len(pending_ids)}명에게 재알림을 보냈습니다",
    )


@router.put("/meal-calls/{meal_call_id}/complete", response_model=MealCallResponse)
async def complete_meal_call(
    meal_call_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    handler = CompleteMealCallHandler(_meal_repo())
    dto = await handler.handle(CompleteMealCallCommand(
        meal_call_id=meal_call_id,
        requester_id=current_user.member_id,
    ))
    return _to_response(dto)
