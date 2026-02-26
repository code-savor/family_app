from dataclasses import dataclass, field
from datetime import datetime, timezone
import uuid

from src.shared.domain.aggregate_root import AggregateRoot
from src.identity.domain.member import Member, MemberRole
from src.identity.domain.invite_link import InviteLink
from src.identity.domain.events import FamilyCreated, MemberJoined, InviteLinkCreated

MAX_MEMBERS = 10


@dataclass
class Family(AggregateRoot):
    id: str
    name: str
    created_at: datetime
    members: list[Member] = field(default_factory=list)
    invite_links: list[InviteLink] = field(default_factory=list)

    def __post_init__(self):
        super().__init__()

    @classmethod
    def create(cls, name: str, owner_nickname: str, owner_hashed_pin: str) -> "Family":
        family_id = str(uuid.uuid4())
        owner = Member.create(
            family_id=family_id,
            nickname=owner_nickname,
            hashed_pin=owner_hashed_pin,
            role=MemberRole.OWNER,
        )
        family = cls(
            id=family_id,
            name=name,
            created_at=datetime.now(timezone.utc),
            members=[owner],
        )
        family._add_event(
            FamilyCreated(
                family_id=family_id,
                family_name=name,
                owner_id=owner.id,
                owner_nickname=owner_nickname,
            )
        )
        return family

    def add_member(self, nickname: str, hashed_pin: str) -> Member:
        if len(self.members) >= MAX_MEMBERS:
            raise ValueError(f"가족 구성원은 최대 {MAX_MEMBERS}명까지 등록할 수 있습니다")
        if any(m.nickname == nickname for m in self.members):
            raise ValueError(f"닉네임 '{nickname}'은(는) 이미 사용 중입니다")

        member = Member.create(
            family_id=self.id,
            nickname=nickname,
            hashed_pin=hashed_pin,
            role=MemberRole.MEMBER,
        )
        self.members.append(member)
        self._add_event(
            MemberJoined(
                family_id=self.id,
                member_id=member.id,
                nickname=nickname,
            )
        )
        return member

    def create_invite_link(
        self,
        created_by: str,
        expires_at: datetime,
        max_uses: int = 1,
    ) -> InviteLink:
        link = InviteLink.create(
            family_id=self.id,
            created_by=created_by,
            expires_at=expires_at,
            max_uses=max_uses,
        )
        self.invite_links.append(link)
        self._add_event(
            InviteLinkCreated(
                family_id=self.id,
                invite_link_id=link.id,
                token=link.token,
            )
        )
        return link

    def get_member(self, member_id: str) -> Member | None:
        return next((m for m in self.members if m.id == member_id), None)

    def get_member_by_nickname(self, nickname: str) -> Member | None:
        return next((m for m in self.members if m.nickname == nickname), None)
