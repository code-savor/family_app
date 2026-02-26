from abc import ABC, abstractmethod


class PushNotificationService(ABC):
    @abstractmethod
    async def send(self, tokens: list[str], title: str, body: str, data: dict | None = None) -> None: ...
