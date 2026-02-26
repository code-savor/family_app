from fastapi import APIRouter, Depends

from src.notification.api.schemas import RegisterDeviceRequest, DeviceRegistrationResponse
from src.notification.application.commands import RegisterDeviceCommand, UnregisterDeviceCommand
from src.notification.domain.device_registration import DeviceRegistration
from src.notification.infrastructure.sqlite_device_repo import SqliteDeviceRepository
from src.shared.api.dependencies import get_current_user, CurrentUser

router = APIRouter(tags=["notification"])


def _repo(): return SqliteDeviceRepository()


@router.post("/devices", response_model=DeviceRegistrationResponse, status_code=201)
async def register_device(
    body: RegisterDeviceRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    repo = _repo()
    reg = DeviceRegistration.create(
        member_id=current_user.member_id,
        expo_push_token=body.expo_push_token,
    )
    await repo.save(reg)
    return DeviceRegistrationResponse(
        id=reg.id, member_id=reg.member_id,
        expo_push_token=reg.expo_push_token,
        registered_at=reg.registered_at,
    )


@router.delete("/devices", status_code=204)
async def unregister_device(current_user: CurrentUser = Depends(get_current_user)):
    repo = _repo()
    await repo.delete_by_member(current_user.member_id)
