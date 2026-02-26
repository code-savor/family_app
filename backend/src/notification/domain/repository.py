from abc import ABC, abstractmethod
from src.notification.domain.device_registration import DeviceRegistration


class DeviceRegistrationRepository(ABC):
    @abstractmethod
    async def save(self, registration: DeviceRegistration) -> None: ...

    @abstractmethod
    async def find_by_member(self, member_id: str) -> DeviceRegistration | None: ...

    @abstractmethod
    async def find_by_family(self, family_id: str) -> list[DeviceRegistration]: ...

    @abstractmethod
    async def find_by_member_ids(self, member_ids: list[str]) -> list[DeviceRegistration]: ...

    @abstractmethod
    async def delete_by_member(self, member_id: str) -> None: ...
