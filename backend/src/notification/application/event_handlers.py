import logging
from src.meal_call.domain.events import MealCallCreated, ReminderRequested
from src.notification.domain.repository import DeviceRegistrationRepository
from src.notification.domain.notification_service import PushNotificationService

logger = logging.getLogger(__name__)


class MealCallNotificationHandler:
    def __init__(
        self,
        device_repo: DeviceRegistrationRepository,
        push_service: PushNotificationService,
    ):
        self._device_repo = device_repo
        self._push_service = push_service

    async def on_meal_call_created(self, event: MealCallCreated) -> None:
        """밥먹자 생성 시 가족 전원에게 Push"""
        registrations = await self._device_repo.find_by_family(event.family_id)
        tokens = [r.expo_push_token for r in registrations
                  if r.member_id != event.caller_id]  # 발신자 제외

        menu_text = ", ".join(event.menu_names) if event.menu_names else ""
        body = f"{menu_text} 준비됐어요!" if menu_text else "밥 먹을 시간이에요!"
        if event.message:
            body = event.message

        await self._push_service.send(
            tokens=tokens,
            title=f"🍚 {event.caller_nickname}이(가) 밥먹자!",
            body=body,
            data={"type": "MEAL_CALL", "meal_call_id": event.meal_call_id},
        )
        logger.info(f"MealCall push 발송: {len(tokens)}명, meal_call_id={event.meal_call_id}")

    async def on_reminder_requested(self, event: ReminderRequested) -> None:
        """재알림 요청 시 미응답자에게 Push"""
        if not event.pending_member_ids:
            return

        registrations = await self._device_repo.find_by_member_ids(event.pending_member_ids)
        tokens = [r.expo_push_token for r in registrations]

        await self._push_service.send(
            tokens=tokens,
            title="⏰ 밥먹자 재알림",
            body="아직 응답하지 않았어요! 밥 먹을 건가요?",
            data={"type": "MEAL_CALL_REMINDER", "meal_call_id": event.meal_call_id},
        )
        logger.info(f"Reminder push 발송: {len(tokens)}명, meal_call_id={event.meal_call_id}")
