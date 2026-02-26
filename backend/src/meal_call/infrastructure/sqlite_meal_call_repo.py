from datetime import datetime, timezone

from src.meal_call.domain.meal_call import MealCall, MealCallStatus
from src.meal_call.domain.meal_response import MealResponse, ResponseType
from src.meal_call.domain.menu_item import MenuItem, MenuCategory
from src.meal_call.domain.repository import MealCallRepository, MenuItemRepository
from src.shared.infrastructure.database import get_db


def _parse_dt(s: str) -> datetime:
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _parse_dt_opt(s: str | None) -> datetime | None:
    return _parse_dt(s) if s else None


class SqliteMealCallRepository(MealCallRepository):
    async def save(self, mc: MealCall) -> None:
        async with get_db() as db:
            await db.execute(
                """INSERT OR REPLACE INTO meal_calls
                   (id, family_id, caller_id, message, status, created_at, completed_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (mc.id, mc.family_id, mc.caller_id, mc.message,
                 mc.status.value if hasattr(mc.status, 'value') else mc.status,
                 mc.created_at.isoformat(),
                 mc.completed_at.isoformat() if mc.completed_at else None),
            )
            # menus
            await db.execute("DELETE FROM meal_call_menus WHERE meal_call_id = ?", (mc.id,))
            for menu in mc.menus:
                await db.execute(
                    "INSERT OR IGNORE INTO meal_call_menus (meal_call_id, menu_item_id) VALUES (?, ?)",
                    (mc.id, menu.id),
                )
            # responses (upsert)
            for r in mc.responses:
                await db.execute(
                    """INSERT OR REPLACE INTO meal_responses
                       (id, meal_call_id, member_id, response_type, custom_message, responded_at)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (r.id, r.meal_call_id, r.member_id,
                     r.response_type.value if hasattr(r.response_type, 'value') else r.response_type,
                     r.custom_message, r.responded_at.isoformat()),
                )
            await db.commit()

    async def _load(self, row, db) -> MealCall:
        menus_rows = await db.execute_fetchall(
            """SELECT mi.* FROM menu_items mi
               JOIN meal_call_menus mcm ON mi.id = mcm.menu_item_id
               WHERE mcm.meal_call_id = ?""",
            (row["id"],),
        )
        resp_rows = await db.execute_fetchall(
            "SELECT * FROM meal_responses WHERE meal_call_id = ?", (row["id"],)
        )
        # all_member_ids: 해당 가족의 현재 멤버 (응답 추적용)
        member_rows = await db.execute_fetchall(
            "SELECT id FROM members WHERE family_id = ?", (row["family_id"],)
        )

        mc = MealCall(
            id=row["id"], family_id=row["family_id"],
            caller_id=row["caller_id"], message=row["message"],
            status=MealCallStatus(row["status"]),
            created_at=_parse_dt(row["created_at"]),
            completed_at=_parse_dt_opt(row["completed_at"]),
            menus=[
                MenuItem(
                    id=m["id"], family_id=m["family_id"], name=m["name"],
                    emoji_icon=m["emoji_icon"], category=MenuCategory(m["category"]),
                    created_at=_parse_dt(m["created_at"]),
                )
                for m in menus_rows
            ],
            responses=[
                MealResponse(
                    id=r["id"], meal_call_id=r["meal_call_id"],
                    member_id=r["member_id"],
                    response_type=ResponseType(r["response_type"]),
                    custom_message=r["custom_message"],
                    responded_at=_parse_dt(r["responded_at"]),
                )
                for r in resp_rows
            ],
            all_member_ids=[m["id"] for m in member_rows],
        )
        mc._domain_events.clear()
        return mc

    async def find_by_id(self, meal_call_id: str) -> MealCall | None:
        async with get_db() as db:
            rows = await db.execute_fetchall(
                "SELECT * FROM meal_calls WHERE id = ?", (meal_call_id,)
            )
            if not rows:
                return None
            return await self._load(rows[0], db)

    async def find_active_by_family(self, family_id: str) -> MealCall | None:
        async with get_db() as db:
            rows = await db.execute_fetchall(
                "SELECT * FROM meal_calls WHERE family_id = ? AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1",
                (family_id,),
            )
            if not rows:
                return None
            return await self._load(rows[0], db)

    async def find_by_family(self, family_id: str, limit: int = 20) -> list[MealCall]:
        async with get_db() as db:
            rows = await db.execute_fetchall(
                "SELECT * FROM meal_calls WHERE family_id = ? ORDER BY created_at DESC LIMIT ?",
                (family_id, limit),
            )
            return [await self._load(r, db) for r in rows]


class SqliteMenuItemRepository(MenuItemRepository):
    async def save(self, item: MenuItem) -> None:
        async with get_db() as db:
            await db.execute(
                """INSERT OR REPLACE INTO menu_items
                   (id, family_id, name, emoji_icon, category, created_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (item.id, item.family_id, item.name, item.emoji_icon,
                 item.category.value if hasattr(item.category, 'value') else item.category,
                 item.created_at.isoformat()),
            )
            await db.commit()

    async def find_by_family(self, family_id: str) -> list[MenuItem]:
        async with get_db() as db:
            rows = await db.execute_fetchall(
                "SELECT * FROM menu_items WHERE family_id = ? ORDER BY name",
                (family_id,),
            )
            return [
                MenuItem(
                    id=r["id"], family_id=r["family_id"], name=r["name"],
                    emoji_icon=r["emoji_icon"], category=MenuCategory(r["category"]),
                    created_at=_parse_dt(r["created_at"]),
                )
                for r in rows
            ]

    async def find_by_id(self, menu_item_id: str) -> MenuItem | None:
        async with get_db() as db:
            rows = await db.execute_fetchall(
                "SELECT * FROM menu_items WHERE id = ?", (menu_item_id,)
            )
            if not rows:
                return None
            r = rows[0]
            return MenuItem(
                id=r["id"], family_id=r["family_id"], name=r["name"],
                emoji_icon=r["emoji_icon"], category=MenuCategory(r["category"]),
                created_at=_parse_dt(r["created_at"]),
            )
