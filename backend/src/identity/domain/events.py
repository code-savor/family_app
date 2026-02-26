from dataclasses import dataclass
from src.shared.domain.domain_event import DomainEvent


@dataclass(frozen=True)
class FamilyCreated(DomainEvent):
    family_id: str = ""
    family_name: str = ""
    owner_id: str = ""
    owner_nickname: str = ""


@dataclass(frozen=True)
class MemberJoined(DomainEvent):
    family_id: str = ""
    member_id: str = ""
    nickname: str = ""


@dataclass(frozen=True)
class InviteLinkCreated(DomainEvent):
    family_id: str = ""
    invite_link_id: str = ""
    token: str = ""
