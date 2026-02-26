from datetime import datetime, timezone, timedelta
import jwt
from src.config import (
    JWT_SECRET_KEY, JWT_ALGORITHM,
    JWT_ACCESS_TOKEN_EXPIRE_HOURS, JWT_REFRESH_TOKEN_EXPIRE_DAYS,
)
from src.shared.api.error_handlers import DomainError


class JwtService:
    def create_tokens(self, member) -> dict[str, str]:
        now = datetime.now(timezone.utc)
        access_payload = {
            "sub": member.id,
            "family_id": member.family_id,
            "nickname": member.nickname,
            "role": member.role.value if hasattr(member.role, "value") else member.role,
            "type": "access",
            "iat": now,
            "exp": now + timedelta(hours=JWT_ACCESS_TOKEN_EXPIRE_HOURS),
        }
        refresh_payload = {
            "sub": member.id,
            "family_id": member.family_id,
            "type": "refresh",
            "iat": now,
            "exp": now + timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS),
        }
        return {
            "access_token": jwt.encode(access_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM),
            "refresh_token": jwt.encode(refresh_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM),
        }

    def verify_refresh_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            if payload.get("type") != "refresh":
                raise DomainError("유효하지 않은 토큰 타입입니다", "INVALID_TOKEN")
            return payload
        except jwt.ExpiredSignatureError:
            raise DomainError("리프레시 토큰이 만료되었습니다", "TOKEN_EXPIRED")
        except jwt.InvalidTokenError:
            raise DomainError("유효하지 않은 토큰입니다", "INVALID_TOKEN")
