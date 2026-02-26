import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from src.main import app
from src.shared.infrastructure.database import init_db
import os


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db(tmp_path, monkeypatch):
    db_path = str(tmp_path / "test.db")
    monkeypatch.setenv("DB_PATH", db_path)
    # config 모듈의 DB_PATH 업데이트
    import src.config as config
    monkeypatch.setattr(config, "DB_PATH", db_path)
    import src.shared.infrastructure.database as db_module
    monkeypatch.setattr(db_module, "DB_PATH", db_path)
    await init_db()
    yield


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
