from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class DomainError(Exception):
    """도메인 비즈니스 규칙 위반"""
    def __init__(self, message: str, code: str = "DOMAIN_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class NotFoundError(DomainError):
    def __init__(self, resource: str, id: str):
        super().__init__(f"{resource}을(를) 찾을 수 없습니다: {id}", "NOT_FOUND")
        self.resource = resource


class ConflictError(DomainError):
    def __init__(self, message: str):
        super().__init__(message, "CONFLICT")


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def domain_error_handler(request: Request, exc: DomainError):
        status_code = 404 if isinstance(exc, NotFoundError) else (
            409 if isinstance(exc, ConflictError) else 400
        )
        return JSONResponse(
            status_code=status_code,
            content={"error": exc.code, "message": exc.message},
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={"error": "INTERNAL_ERROR", "message": "서버 오류가 발생했습니다"},
        )
