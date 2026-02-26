from pydantic import BaseModel
from datetime import datetime


class RegisterDeviceRequest(BaseModel):
    expo_push_token: str


class DeviceRegistrationResponse(BaseModel):
    id: str
    member_id: str
    expo_push_token: str
    registered_at: datetime
