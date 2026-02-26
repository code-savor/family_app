from abc import ABC, abstractmethod
from src.identity.domain.family import Family
from src.identity.domain.invite_link import InviteLink


class FamilyRepository(ABC):
    @abstractmethod
    async def save(self, family: Family) -> None: ...

    @abstractmethod
    async def find_by_id(self, family_id: str) -> Family | None: ...

    @abstractmethod
    async def find_invite_link_by_token(self, token: str) -> tuple[Family, InviteLink] | None: ...

    @abstractmethod
    async def save_invite_link(self, link: InviteLink) -> None: ...

    @abstractmethod
    async def save_member(self, family_id: str, member_id: str, nickname: str,
                          hashed_pin: str, role: str) -> None: ...
