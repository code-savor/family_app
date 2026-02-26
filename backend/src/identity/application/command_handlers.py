from src.identity.application.commands import (
    CreateFamilyCommand, JoinFamilyCommand,
    CreateInviteLinkCommand, LoginCommand, RefreshTokenCommand,
)
from src.identity.application.dto import (
    FamilyDto, MemberDto, InviteLinkDto, AuthTokenDto,
)
from src.identity.domain.family import Family
from src.identity.domain.repository import FamilyRepository
from src.identity.infrastructure.pin_hasher import PinHasher
from src.identity.infrastructure.jwt_service import JwtService
from src.shared.api.error_handlers import NotFoundError, ConflictError, DomainError
from src.shared.infrastructure.event_bus import event_bus


def _member_dto(m) -> MemberDto:
    return MemberDto(id=m.id, family_id=m.family_id, nickname=m.nickname,
                     role=m.role.value if hasattr(m.role, 'value') else m.role,
                     created_at=m.created_at)


def _family_dto(f: Family) -> FamilyDto:
    return FamilyDto(
        id=f.id, name=f.name, created_at=f.created_at,
        members=[_member_dto(m) for m in f.members],
    )


class CreateFamilyHandler:
    def __init__(self, repo: FamilyRepository, pin_hasher: PinHasher, jwt_service: JwtService):
        self._repo = repo
        self._pin_hasher = pin_hasher
        self._jwt = jwt_service

    async def handle(self, cmd: CreateFamilyCommand) -> AuthTokenDto:
        hashed_pin = self._pin_hasher.hash(cmd.owner_pin)
        family = Family.create(cmd.family_name, cmd.owner_nickname, hashed_pin)
        await self._repo.save(family)

        owner = family.members[0]
        events = family.collect_events()
        await event_bus.publish_all(events)

        tokens = self._jwt.create_tokens(owner)
        return AuthTokenDto(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            member=_member_dto(owner),
        )


class JoinFamilyHandler:
    def __init__(self, repo: FamilyRepository, pin_hasher: PinHasher, jwt_service: JwtService):
        self._repo = repo
        self._pin_hasher = pin_hasher
        self._jwt = jwt_service

    async def handle(self, cmd: JoinFamilyCommand) -> AuthTokenDto:
        result = await self._repo.find_invite_link_by_token(cmd.token)
        if not result:
            raise NotFoundError("초대 링크", cmd.token)

        family, link = result
        if not link.is_valid():
            raise DomainError("초대 링크가 만료되었거나 사용 횟수를 초과했습니다", "INVITE_EXPIRED")

        if any(m.nickname == cmd.nickname for m in family.members):
            raise ConflictError(f"닉네임 '{cmd.nickname}'은(는) 이미 사용 중입니다")

        hashed_pin = self._pin_hasher.hash(cmd.pin)
        member = family.add_member(cmd.nickname, hashed_pin)
        link.use()

        await self._repo.save_member(family.id, member.id, member.nickname,
                                     member.hashed_pin, member.role.value)
        await self._repo.save_invite_link(link)

        events = family.collect_events()
        await event_bus.publish_all(events)

        tokens = self._jwt.create_tokens(member)
        return AuthTokenDto(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            member=_member_dto(member),
        )


class CreateInviteLinkHandler:
    def __init__(self, repo: FamilyRepository):
        self._repo = repo

    async def handle(self, cmd: CreateInviteLinkCommand) -> InviteLinkDto:
        family = await self._repo.find_by_id(cmd.family_id)
        if not family:
            raise NotFoundError("가족", cmd.family_id)

        link = family.create_invite_link(
            created_by=cmd.created_by,
            expires_at=cmd.expires_at,
            max_uses=cmd.max_uses,
        )
        await self._repo.save_invite_link(link)

        events = family.collect_events()
        await event_bus.publish_all(events)

        return InviteLinkDto(
            id=link.id, family_id=link.family_id, token=link.token,
            expires_at=link.expires_at, max_uses=link.max_uses,
            used_count=link.used_count,
        )


class LoginHandler:
    def __init__(self, repo: FamilyRepository, pin_hasher: PinHasher, jwt_service: JwtService):
        self._repo = repo
        self._pin_hasher = pin_hasher
        self._jwt = jwt_service

    async def handle(self, cmd: LoginCommand) -> AuthTokenDto:
        family = await self._repo.find_by_id(cmd.family_id)
        if not family:
            raise NotFoundError("가족", cmd.family_id)

        member = family.get_member_by_nickname(cmd.nickname)
        if not member or not self._pin_hasher.verify(cmd.pin, member.hashed_pin):
            raise DomainError("닉네임 또는 PIN이 올바르지 않습니다", "INVALID_CREDENTIALS")

        tokens = self._jwt.create_tokens(member)
        return AuthTokenDto(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            member=_member_dto(member),
        )


class GetFamilyHandler:
    def __init__(self, repo: FamilyRepository):
        self._repo = repo

    async def handle(self, family_id: str) -> FamilyDto:
        family = await self._repo.find_by_id(family_id)
        if not family:
            raise NotFoundError("가족", family_id)
        return _family_dto(family)


class ValidateInviteLinkHandler:
    def __init__(self, repo: FamilyRepository):
        self._repo = repo

    async def handle(self, token: str) -> InviteLinkDto:
        result = await self._repo.find_invite_link_by_token(token)
        if not result:
            raise NotFoundError("초대 링크", token)

        family, link = result
        if not link.is_valid():
            raise DomainError("초대 링크가 만료되었거나 사용 횟수를 초과했습니다", "INVITE_EXPIRED")

        return InviteLinkDto(
            id=link.id, family_id=link.family_id, token=link.token,
            expires_at=link.expires_at, max_uses=link.max_uses,
            used_count=link.used_count,
        )


class RefreshTokenHandler:
    def __init__(self, repo: FamilyRepository, jwt_service: JwtService):
        self._repo = repo
        self._jwt = jwt_service

    async def handle(self, cmd: RefreshTokenCommand) -> AuthTokenDto:
        payload = self._jwt.verify_refresh_token(cmd.refresh_token)
        family = await self._repo.find_by_id(payload["family_id"])
        if not family:
            raise DomainError("유효하지 않은 토큰입니다", "INVALID_TOKEN")

        member = family.get_member(payload["sub"])
        if not member:
            raise DomainError("유효하지 않은 토큰입니다", "INVALID_TOKEN")

        tokens = self._jwt.create_tokens(member)
        return AuthTokenDto(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            member=_member_dto(member),
        )
