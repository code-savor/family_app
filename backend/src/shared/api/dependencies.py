from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from src.config import JWT_SECRET_KEY, JWT_ALGORITHM

security = HTTPBearer()


class CurrentUser:
    def __init__(self, member_id: str, family_id: str, nickname: str, role: str):
        self.member_id = member_id
        self.family_id = family_id
        self.nickname = nickname
        self.role = role


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return CurrentUser(
            member_id=payload["sub"],
            family_id=payload["family_id"],
            nickname=payload["nickname"],
            role=payload["role"],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰이 만료되었습니다",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다",
        )
