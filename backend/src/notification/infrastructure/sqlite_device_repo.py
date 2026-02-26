from datetime import datetime, timezone

from src.notification.domain.device_registration import DeviceRegistration
from src.notification.domain.repository import DeviceRegistrationRepository
from src.shared.infrastructure.database import get_db


def _parse_dt(s: str) -> datetime:
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


class SqliteDeviceRepository(DeviceRegistrationRepository):
    async def save(self, reg: DeviceRegistration) -> None:
        async with get_db() as db:
            # member당 1개 토큰 (upsert by member_id)
            await db.execute(
                """INSERT INTO device_registrations (id, member_id, expo_push_token, registered_at)
                   VALUES (?, ?, ?, ?)
                   ON CONFLICT(member_id) DO UPDATE SET
                     expo_push_token = excluded.expo_push_token,
                     registered_at = excluded.registered_at""",
                (reg.id, reg.member_id, reg.expo_push_token, reg.registered_at.isoformat()),
            )
            await db.commit()

    async def find_by_member(self, member_id: str) -> DeviceRegistration | None:
        async with get_db() as db:
            rows = await db.execute_fetchall(
                "SELECT * FROM device_registrations WHERE member_id = ?", (member_id,)
            )
            if not rows:
                return None
            r = rows[0]
            return DeviceRegistration(
                id=r["id"], member_id=r["member_id"],
                expo_push_token=r["expo_push_token"],
                registered_at=_parse_dt(r["registered_at"]),
            )

    async def find_by_family(self, family_id: str) -> list[DeviceRegistration]:
        async with get_db() as db:
            rows = await db.execute_fetchall(
                """SELECT dr.* FROM device_registrations dr
                   JOIN members m ON dr.member_id = m.id
                   WHERE m.family_id = ?""",
                (family_id,),
            )
            return [
                DeviceRegistration(
                    id=r["id"], member_id=r["member_id"],
                    expo_push_token=r["expo_push_token"],
                    registered_at=_parse_dt(r["registered_at"]),
                )
                for r in rows
            ]

    async def find_by_member_ids(self, member_ids: list[str]) -> list[DeviceRegistration]:
        if not member_ids:
            return []
        placeholders = ",".join("?" * len(member_ids))
        async with get_db() as db:
            rows = await db.execute_fetchall(
                f"SELECT * FROM device_registrations WHERE member_id IN ({placeholders})",
                tuple(member_ids),
            )
            return [
                DeviceRegistration(
                    id=r["id"], member_id=r["member_id"],
                    expo_push_token=r["expo_push_token"],
                    registered_at=_parse_dt(r["registered_at"]),
                )
                for r in rows
            ]

    async def delete_by_member(self, member_id: str) -> None:
        async with get_db() as db:
            await db.execute(
                "DELETE FROM device_registrations WHERE member_id = ?", (member_id,)
            )
            await db.commit()
