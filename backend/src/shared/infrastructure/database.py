import aiosqlite
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from src.config import DB_PATH
import os


async def init_db() -> None:
    """앱 시작 시 DB 파일 및 테이블 초기화"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA foreign_keys=ON")
        await _create_tables(db)
        await db.commit()


async def _create_tables(db: aiosqlite.Connection) -> None:
    # Identity & Access
    await db.execute("""
        CREATE TABLE IF NOT EXISTS families (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS members (
            id TEXT PRIMARY KEY,
            family_id TEXT NOT NULL,
            nickname TEXT NOT NULL,
            hashed_pin TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'MEMBER',
            created_at TEXT NOT NULL,
            FOREIGN KEY (family_id) REFERENCES families(id),
            UNIQUE (family_id, nickname)
        )
    """)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS invite_links (
            id TEXT PRIMARY KEY,
            family_id TEXT NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            max_uses INTEGER NOT NULL DEFAULT 1,
            used_count INTEGER NOT NULL DEFAULT 0,
            created_by TEXT NOT NULL,
            FOREIGN KEY (family_id) REFERENCES families(id)
        )
    """)
    # Meal Call
    await db.execute("""
        CREATE TABLE IF NOT EXISTS menu_items (
            id TEXT PRIMARY KEY,
            family_id TEXT NOT NULL,
            name TEXT NOT NULL,
            emoji_icon TEXT NOT NULL DEFAULT '🍽️',
            category TEXT NOT NULL DEFAULT 'ETC',
            created_at TEXT NOT NULL,
            FOREIGN KEY (family_id) REFERENCES families(id)
        )
    """)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS meal_calls (
            id TEXT PRIMARY KEY,
            family_id TEXT NOT NULL,
            caller_id TEXT NOT NULL,
            message TEXT,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            created_at TEXT NOT NULL,
            completed_at TEXT,
            FOREIGN KEY (family_id) REFERENCES families(id),
            FOREIGN KEY (caller_id) REFERENCES members(id)
        )
    """)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS meal_call_menus (
            meal_call_id TEXT NOT NULL,
            menu_item_id TEXT NOT NULL,
            PRIMARY KEY (meal_call_id, menu_item_id),
            FOREIGN KEY (meal_call_id) REFERENCES meal_calls(id),
            FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
        )
    """)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS meal_responses (
            id TEXT PRIMARY KEY,
            meal_call_id TEXT NOT NULL,
            member_id TEXT NOT NULL,
            response_type TEXT NOT NULL,
            custom_message TEXT,
            responded_at TEXT NOT NULL,
            FOREIGN KEY (meal_call_id) REFERENCES meal_calls(id),
            FOREIGN KEY (member_id) REFERENCES members(id),
            UNIQUE (meal_call_id, member_id)
        )
    """)
    # Notification
    await db.execute("""
        CREATE TABLE IF NOT EXISTS device_registrations (
            id TEXT PRIMARY KEY,
            member_id TEXT NOT NULL,
            expo_push_token TEXT NOT NULL,
            registered_at TEXT NOT NULL,
            FOREIGN KEY (member_id) REFERENCES members(id),
            UNIQUE (member_id)
        )
    """)


@asynccontextmanager
async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA foreign_keys=ON")
        yield db
