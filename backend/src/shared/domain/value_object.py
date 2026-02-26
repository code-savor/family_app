from dataclasses import dataclass


@dataclass(frozen=True)
class ValueObject:
    """Value Object 베이스 - 불변, 값 기반 동등성"""
    pass


@dataclass(frozen=True)
class FamilyId(ValueObject):
    value: str


@dataclass(frozen=True)
class MemberId(ValueObject):
    value: str
