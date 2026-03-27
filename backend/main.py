from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes.auth import router as auth_router
from app.routes.books import router as books_router
from app.routes.checkout import router as checkout_router
from app.routes.devoluciones import router as devoluciones_router
from app.routes.payments import router as payments_router
from app.routes.payments import webhook_router
from app.routes.pedidos import router as pedidos_router
from app.routes.reservations import router as reservations_router
from app.routes.tarjetas import router as tarjetas_router
from app.routes.usuarios_admin import router as usuarios_admin_router
from app.services.scheduler_service import detener_scheduler, iniciar_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    iniciar_scheduler()
    yield
    detener_scheduler()


app = FastAPI(
    title="Biblioteca Digital API",
    description="Backend para el sistema de gestión de biblioteca",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(books_router)
app.include_router(reservations_router)
app.include_router(payments_router)
app.include_router(webhook_router)
app.include_router(pedidos_router)
app.include_router(checkout_router)
app.include_router(devoluciones_router)
app.include_router(tarjetas_router)
app.include_router(usuarios_admin_router)


@app.get("/", tags=["Health"])
async def root() -> dict:
    return {"status": "ok", "message": "Bienvenido a la API de la Biblioteca Digital"}
