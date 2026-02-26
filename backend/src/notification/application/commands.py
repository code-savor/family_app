from dataclasses import dataclass


@dataclass
class RegisterDeviceCommand:
    member_id: str
    expo_push_token: str


@dataclass
class UnregisterDeviceCommand:
    member_id: str
