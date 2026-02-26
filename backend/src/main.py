from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.shared.infrastructure.database import init_db
from src.shared.infrastructure.event_bus import event_bus
from src.shared.api.error_handlers import register_error_handlers


def _setup_event_handlers() -> None:
    from src.notification.application.event_handlers import MealCallNotificationHandler
    from src.notification.infrastructure.sqlite_device_repo import SqliteDeviceRepository
    from src.notification.infrastructure.expo_push_service import ExpoPushService

    handler = MealCallNotificationHandler(
        device_repo=SqliteDeviceRepository(),
        push_service=ExpoPushService(),
    )
    event_bus.subscribe("MealCallCreated", handler.on_meal_call_created)
    event_bus.subscribe("ReminderRequested", handler.on_reminder_requested)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    _setup_event_handlers()
    yield


app = FastAPI(
    title="Family App - 밥먹자",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

from src.identity.api.router import router as identity_router
from src.meal_call.api.router import router as meal_call_router
from src.notification.api.router import router as notification_router

app.include_router(identity_router, prefix="/api/v1")
app.include_router(meal_call_router, prefix="/api/v1")
app.include_router(notification_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "app": "밥먹자"}
