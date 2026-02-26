import bcrypt


class PinHasher:
    def hash(self, pin: str) -> str:
        return bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()

    def verify(self, pin: str, hashed: str) -> bool:
        return bcrypt.checkpw(pin.encode(), hashed.encode())
