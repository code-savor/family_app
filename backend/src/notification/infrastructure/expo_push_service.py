import logging
import httpx
from src.notification.domain.notification_service import PushNotificationService

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


class ExpoPushService(PushNotificationService):
    async def send(
        self,
        tokens: list[str],
        title: str,
        body: str,
        data: dict | None = None,
    ) -> None:
        if not tokens:
            return

        messages = [
            {
                "to": token,
                "title": title,
                "body": body,
                "data": data or {},
                "sound": "default",
                "priority": "high",
            }
            for token in tokens
            if token.startswith("ExponentPushToken[") or token.startswith("ExpoPushToken[")
        ]

        if not messages:
            logger.warning("유효한 Expo Push Token이 없습니다")
            return

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    EXPO_PUSH_URL,
                    json=messages,
                    headers={"Content-Type": "application/json"},
                )
                resp.raise_for_status()
                result = resp.json()
                for item in result.get("data", []):
                    if item.get("status") == "error":
                        logger.error(f"Push 전송 실패: {item.get('message')}")
        except httpx.HTTPError as e:
            logger.error(f"Expo Push API 오류: {e}")
