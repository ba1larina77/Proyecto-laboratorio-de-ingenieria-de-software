"""Rutas para gestión de tarjetas guardadas y recarga simulada."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import Usuario
from app.schemas.payment import TransaccionRespuesta
from app.schemas.payment_method import (
    RecargaConTarjeta,
    TarjetaCrear,
    TarjetaRespuesta,
)
from app.services.tarjeta_service import TarjetaService

router = APIRouter(prefix="/cards", tags=["Tarjetas"])


@router.post(
    "",
    response_model=TarjetaRespuesta,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nueva tarjeta",
)
def registrar_tarjeta(
    body: TarjetaCrear,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return TarjetaService.registrar_tarjeta(
        db=db,
        usuario_id=usuario.id,
        numero_tarjeta=body.numero_tarjeta,
        nombre_titular=body.nombre_titular,
        mes_expiracion=body.mes_expiracion,
        anio_expiracion=body.anio_expiracion,
        cvv=body.cvv,
    )


@router.get(
    "",
    response_model=list[TarjetaRespuesta],
    summary="Listar tarjetas guardadas",
)
def listar_tarjetas(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return TarjetaService.listar_tarjetas(db, usuario.id)


@router.put(
    "/{tarjeta_id}/default",
    response_model=TarjetaRespuesta,
    summary="Establecer tarjeta predeterminada",
)
def establecer_predeterminada(
    tarjeta_id: UUID,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return TarjetaService.establecer_predeterminada(db, usuario.id, tarjeta_id)


@router.delete(
    "/{tarjeta_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar tarjeta guardada",
)
def eliminar_tarjeta(
    tarjeta_id: UUID,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    TarjetaService.eliminar_tarjeta(db, usuario.id, tarjeta_id)


@router.post(
    "/recharge",
    response_model=TransaccionRespuesta,
    status_code=status.HTTP_201_CREATED,
    summary="Recargar billetera con tarjeta guardada",
)
def recargar_con_tarjeta(
    body: RecargaConTarjeta,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return TarjetaService.recargar_con_tarjeta(
        db=db,
        usuario_id=usuario.id,
        tarjeta_id=body.tarjeta_id,
        monto=body.monto,
        cvv=body.cvv,
    )
