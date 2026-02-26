from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from src.shared.domain.domain_event import DomainEvent


class AggregateRoot:
    """DDD Aggregate Root 베이스 클래스 - 도메인 이벤트 수집 패턴"""

    def __init__(self):
        self._domain_events: list["DomainEvent"] = []

    def _add_event(self, event: "DomainEvent") -> None:
        self._domain_events.append(event)

    def collect_events(self) -> list["DomainEvent"]:
        events = list(self._domain_events)
        self._domain_events.clear()
        return events
