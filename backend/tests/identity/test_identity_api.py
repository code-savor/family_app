import pytest
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


async def test_create_family(client: AsyncClient):
    res = await client.post("/api/v1/families", json={
        "family_name": "김씨 가족",
        "owner_nickname": "아빠",
        "owner_pin": "1234",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["access_token"]
    assert data["member"]["nickname"] == "아빠"
    assert data["member"]["role"] == "OWNER"


async def test_login(client: AsyncClient):
    # 가족 생성
    create_res = await client.post("/api/v1/families", json={
        "family_name": "테스트 가족",
        "owner_nickname": "엄마",
        "owner_pin": "5678",
    })
    family_id = create_res.json()["member"]["family_id"]

    # 로그인
    res = await client.post("/api/v1/auth/login", json={
        "family_id": family_id,
        "nickname": "엄마",
        "pin": "5678",
    })
    assert res.status_code == 200
    assert res.json()["access_token"]


async def test_login_wrong_pin(client: AsyncClient):
    create_res = await client.post("/api/v1/families", json={
        "family_name": "테스트 가족",
        "owner_nickname": "아빠",
        "owner_pin": "1111",
    })
    family_id = create_res.json()["member"]["family_id"]

    res = await client.post("/api/v1/auth/login", json={
        "family_id": family_id,
        "nickname": "아빠",
        "pin": "9999",
    })
    assert res.status_code == 400


async def test_invite_and_join(client: AsyncClient):
    from datetime import datetime, timezone, timedelta

    # 가족 생성
    create_res = await client.post("/api/v1/families", json={
        "family_name": "초대 테스트 가족",
        "owner_nickname": "아빠",
        "owner_pin": "1234",
    })
    token = create_res.json()["access_token"]
    family_id = create_res.json()["member"]["family_id"]

    # 초대 링크 생성
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    invite_res = await client.post(
        f"/api/v1/families/{family_id}/invite-links",
        json={"expires_at": expires_at, "max_uses": 3},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert invite_res.status_code == 201
    invite_token = invite_res.json()["token"]

    # 초대 링크 검증
    validate_res = await client.get(f"/api/v1/invite/{invite_token}")
    assert validate_res.status_code == 200

    # 가입
    join_res = await client.post(f"/api/v1/invite/{invite_token}/join", json={
        "nickname": "엄마",
        "pin": "5678",
    })
    assert join_res.status_code == 201
    assert join_res.json()["member"]["nickname"] == "엄마"
    assert join_res.json()["member"]["role"] == "MEMBER"


async def test_get_family(client: AsyncClient):
    create_res = await client.post("/api/v1/families", json={
        "family_name": "우리 가족",
        "owner_nickname": "아빠",
        "owner_pin": "1234",
    })
    token = create_res.json()["access_token"]
    family_id = create_res.json()["member"]["family_id"]

    res = await client.get(
        f"/api/v1/families/{family_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["name"] == "우리 가족"
    assert len(res.json()["members"]) == 1
