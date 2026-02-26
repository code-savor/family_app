from datetime import datetime, timezone
import aiosqlite

from src.identity.domain.family import Family
from src.identity.domain.member import Member, MemberRole
from src.identity.domain.invite_link import InviteLink
from src.identity.domain.repository import FamilyRepository
from src.shared.infrastructure.database import get_db


def _parse_dt(s: str) -> datetime:
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


class SqliteFamilyRepository(FamilyRepository):
    async def save(self, family: Family) -> None:
        async with get_db() as db:
            await db.execute(
                "INSERT OR REPLACE INTO families (id, name, created_at) VALUES (?, ?, ?)",
                (family.id, family.name, family.created_at.isoformat()),
            )
            for member in family.members:
                await db.execute(
                    """INSERT OR REPLACE INTO members
                       (id, family_id, nickname, hashed_pin, role, created_at)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (member.id, member.family_id, member.nickname,
                     member.hashed_pin,
                     member.role.value if hasattr(member.role, "value") else member.role,
                     member.created_at.isoformat()),
                )
            for link in family.invite_links:
                await db.execute(
                    """INSERT OR REPLACE INTO invite_links
                       (id, family_id, token, expires_at, max_uses, used_count, created_by)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (link.id, link.family_id, link.token,
                     link.expires_at.isoformat(), link.max_uses,
                     link.used_count, link.created_by),
                )
            await db.commit()

    async def save_member(self, family_id: str, member_id: str, nickname: str,
                          hashed_pin: str, role: str) -> None:
        async with get_db() as db:
            await db.execute(
                """INSERT OR REPLACE INTO members
                   (id, family_id, nickname, hashed_pin, role, created_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (member_id, family_id, nickname, hashed_pin, role,
                 datetime.now(timezone.utc).isoformat()),
            )
            await db.commit()

    async def save_invite_link(self, link: InviteLink) -> None:
        async with get_db() as db:
            await db.execute(
                """INSERT OR REPLACE INTO invite_links
                   (id, family_id, token, expires_at, max_uses, used_count, created_by)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (link.id, link.family_id, link.token,
                 link.expires_at.isoformat(), link.max_uses,
                 link.used_count, link.created_by),
            )
            await db.commit()

    async def find_by_id(self, family_id: str) -> Family | None:
        async with get_db() as db:
            row = await db.execute_fetchall(
                "SELECT * FROM families WHERE id = ?", (family_id,)
            )
            if not row:
                return None
            f = row[0]

            members_rows = await db.execute_fetchall(
                "SELECT * FROM members WHERE family_id = ?", (family_id,)
            )
            links_rows = await db.execute_fetchall(
                "SELECT * FROM invite_links WHERE family_id = ?", (family_id,)
            )

        members = [
            Member(
                id=m["id"], family_id=m["family_id"], nickname=m["nickname"],
                hashed_pin=m["hashed_pin"], role=MemberRole(m["role"]),
                created_at=_parse_dt(m["created_at"]),
            )
            for m in members_rows
        ]
        links = [
            InviteLink(
                id=lk["id"], family_id=lk["family_id"], token=lk["token"],
                expires_at=_parse_dt(lk["expires_at"]),
                max_uses=lk["max_uses"], used_count=lk["used_count"],
                created_by=lk["created_by"],
            )
            for lk in links_rows
        ]
        family = Family(
            id=f["id"], name=f["name"],
            created_at=_parse_dt(f["created_at"]),
            members=members, invite_links=links,
        )
        family._domain_events.clear()
        return family

    async def find_invite_link_by_token(self, token: str) -> tuple[Family, InviteLink] | None:
        async with get_db() as db:
            rows = await db.execute_fetchall(
                "SELECT * FROM invite_links WHERE token = ?", (token,)
            )
            if not rows:
                return None
            lk = rows[0]
            link = InviteLink(
                id=lk["id"], family_id=lk["family_id"], token=lk["token"],
                expires_at=_parse_dt(lk["expires_at"]),
                max_uses=lk["max_uses"], used_count=lk["used_count"],
                created_by=lk["created_by"],
            )

        family = await self.find_by_id(link.family_id)
        if not family:
            return None
        return family, link
