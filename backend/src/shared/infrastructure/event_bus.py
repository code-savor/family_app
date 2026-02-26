import logging
from typing import Callable, Awaitable
from src.shared.domain.domain_event import DomainEvent

logger = logging.getLogger(__name__)

EventHandler = Callable[[DomainEvent], Awaitable[None]]


class InMemoryEventBus:
    """단일 프로세스용 인메모리 이벤트 버스"""

    def __init__(self):
        self._handlers: dict[str, list[EventHandler]] = {}

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    async def publish(self, event: DomainEvent) -> None:
        event_type = event.event_type()
        handlers = self._handlers.get(event_type, [])
        for handler in handlers:
            try:
                await handler(event)
            except Exception as e:
                logger.error(f"Event handler error [{event_type}]: {e}", exc_info=True)

    async def publish_all(self, events: list[DomainEvent]) -> None:
        for event in events:
            await self.publish(event)


event_bus = InMemoryEventBus()
