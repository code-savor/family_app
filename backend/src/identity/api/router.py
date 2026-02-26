from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends

from src.identity.api.schemas import (
    CreateFamilyRequest, JoinFamilyRequest, CreateInviteLinkRequest,
    LoginRequest, RefreshTokenRequest,
    FamilyResponse, MemberResponse, InviteLinkResponse, AuthResponse,
)
from src.identity.application.commands import (
    CreateFamilyCommand, JoinFamilyCommand,
    CreateInviteLinkCommand, LoginCommand, RefreshTokenCommand,
)
from src.identity.application.command_handlers import (
    CreateFamilyHandler, JoinFamilyHandler, CreateInviteLinkHandler,
    LoginHandler, GetFamilyHandler, ValidateInviteLinkHandler, RefreshTokenHandler,
)
from src.identity.infrastructure.sqlite_family_repo import SqliteFamilyRepository
from src.identity.infrastructure.pin_hasher import PinHasher
from src.identity.infrastructure.jwt_service import JwtService
from src.shared.api.dependencies import get_current_user, CurrentUser

router = APIRouter(tags=["identity"])

# --- 의존성 팩토리 ---

def _repo() -> SqliteFamilyRepository:
    return SqliteFamilyRepository()

def _pin() -> PinHasher:
    return PinHasher()

def _jwt() -> JwtService:
    return JwtService()


def _invite_url(token: str) -> str:
    return f"babmeokja://invite/{token}"


# --- 가족 ---

@router.post("/families", response_model=AuthResponse, status_code=201)
async def create_family(body: CreateFamilyRequest):
    handler = CreateFamilyHandler(_repo(), _pin(), _jwt())
    result = await handler.handle(CreateFamilyCommand(
        family_name=body.family_name,
        owner_nickname=body.owner_nickname,
        owner_pin=body.owner_pin,
    ))
    return _auth_response(result)


@router.get("/families/{family_id}", response_model=FamilyResponse)
async def get_family(
    family_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    handler = GetFamilyHandler(_repo())
    dto = await handler.handle(family_id)
    return FamilyResponse(
        id=dto.id, name=dto.name, created_at=dto.created_at,
        members=[_member_response(m) for m in dto.members],
    )


@router.get("/families/{family_id}/members", response_model=list[MemberResponse])
async def get_family_members(
    family_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    handler = GetFamilyHandler(_repo())
    dto = await handler.handle(family_id)
    return [_member_response(m) for m in dto.members]


@router.post("/families/{family_id}/invite-links", response_model=InviteLinkResponse, status_code=201)
async def create_invite_link(
    family_id: str,
    body: CreateInviteLinkRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    handler = CreateInviteLinkHandler(_repo())
    dto = await handler.handle(CreateInviteLinkCommand(
        family_id=family_id,
        created_by=current_user.member_id,
        expires_at=body.expires_at,
        max_uses=body.max_uses,
    ))
    return InviteLinkResponse(
        id=dto.id, family_id=dto.family_id, token=dto.token,
        expires_at=dto.expires_at, max_uses=dto.max_uses,
        used_count=dto.used_count,
        invite_url=_invite_url(dto.token),
    )


# --- 초대 ---

@router.get("/invite/{token}", response_model=InviteLinkResponse)
async def validate_invite(token: str):
    handler = ValidateInviteLinkHandler(_repo())
    dto = await handler.handle(token)
    return InviteLinkResponse(
        id=dto.id, family_id=dto.family_id, token=dto.token,
        expires_at=dto.expires_at, max_uses=dto.max_uses,
        used_count=dto.used_count,
        invite_url=_invite_url(dto.token),
    )


@router.post("/invite/{token}/join", response_model=AuthResponse, status_code=201)
async def join_family(token: str, body: JoinFamilyRequest):
    handler = JoinFamilyHandler(_repo(), _pin(), _jwt())
    result = await handler.handle(JoinFamilyCommand(
        token=token,
        nickname=body.nickname,
        pin=body.pin,
    ))
    return _auth_response(result)


# --- 인증 ---

@router.post("/auth/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    handler = LoginHandler(_repo(), _pin(), _jwt())
    result = await handler.handle(LoginCommand(
        family_id=body.family_id,
        nickname=body.nickname,
        pin=body.pin,
    ))
    return _auth_response(result)


@router.post("/auth/refresh", response_model=AuthResponse)
async def refresh_token(body: RefreshTokenRequest):
    handler = RefreshTokenHandler(_repo(), _jwt())
    result = await handler.handle(RefreshTokenCommand(refresh_token=body.refresh_token))
    return _auth_response(result)


# --- 헬퍼 ---

def _member_response(m) -> MemberResponse:
    return MemberResponse(
        id=m.id, family_id=m.family_id, nickname=m.nickname,
        role=m.role, created_at=m.created_at,
    )

def _auth_response(dto) -> AuthResponse:
    return AuthResponse(
        access_token=dto.access_token,
        refresh_token=dto.refresh_token,
        member=_member_response(dto.member) if dto.member else None,
    )
