import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from src.main import app
from src.shared.infrastructure.database import init_db


@pytest.fixture
async def client(tmp_path, monkeypatch):
    db_path = str(tmp_path / "test.db")
    import src.config as config
    import src.shared.infrastructure.database as db_module
    monkeypatch.setattr(config, "DB_PATH", db_path)
    monkeypatch.setattr(db_module, "DB_PATH", db_path)
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_client(client: AsyncClient):
    """가족 생성 후 인증된 클라이언트 반환"""
    res = await client.post("/api/v1/families", json={
        "family_name": "밥먹자 테스트 가족",
        "owner_nickname": "아빠",
        "owner_pin": "1234",
    })
    token = res.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client, res.json()["member"]["family_id"]


async def test_create_menu(auth_client):
    client, family_id = auth_client
    res = await client.post("/api/v1/menus", json={
        "name": "김치찌개",
        "emoji_icon": "🍲",
        "category": "KOREAN",
    })
    assert res.status_code == 201
    assert res.json()["name"] == "김치찌개"


async def test_create_meal_call(auth_client):
    client, family_id = auth_client
    res = await client.post("/api/v1/meal-calls", json={
        "message": "밥 먹자!",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "ACTIVE"
    assert data["message"] == "밥 먹자!"
    assert data["caller_nickname"] == "아빠"


async def test_create_meal_call_with_menu(auth_client):
    client, family_id = auth_client
    menu_res = await client.post("/api/v1/menus", json={
        "name": "삼겹살", "emoji_icon": "🥓", "category": "KOREAN",
    })
    menu_id = menu_res.json()["id"]

    res = await client.post("/api/v1/meal-calls", json={
        "menu_item_ids": [menu_id],
    })
    assert res.status_code == 201
    assert res.json()["menus"][0]["name"] == "삼겹살"


async def test_respond_meal_call(auth_client):
    client, _ = auth_client
    mc_res = await client.post("/api/v1/meal-calls", json={})
    meal_call_id = mc_res.json()["id"]

    res = await client.post(f"/api/v1/meal-calls/{meal_call_id}/respond", json={
        "response_type": "COMING_NOW",
    })
    assert res.status_code == 200
    assert len(res.json()["responses"]) == 1
    assert res.json()["responses"][0]["response_type"] == "COMING_NOW"


async def test_get_active_meal_call(auth_client):
    client, _ = auth_client
    await client.post("/api/v1/meal-calls", json={"message": "점심 먹자"})

    res = await client.get("/api/v1/meal-calls/active")
    assert res.status_code == 200
    assert res.json()["message"] == "점심 먹자"


async def test_complete_meal_call(auth_client):
    client, _ = auth_client
    mc_res = await client.post("/api/v1/meal-calls", json={})
    meal_call_id = mc_res.json()["id"]

    res = await client.put(f"/api/v1/meal-calls/{meal_call_id}/complete")
    assert res.status_code == 200
    assert res.json()["status"] == "COMPLETED"


async def test_remind_meal_call(auth_client):
    client, _ = auth_client
    mc_res = await client.post("/api/v1/meal-calls", json={})
    meal_call_id = mc_res.json()["id"]

    res = await client.post(f"/api/v1/meal-calls/{meal_call_id}/remind")
    assert res.status_code == 200
    assert "pending_member_ids" in res.json()
