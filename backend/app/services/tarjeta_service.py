"""Servicio de gestión de tarjetas guardadas (simulado, sin Stripe)."""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.payment_method import MetodoPago
from app.models.transaction import EstadoTransaccion, TipoTransaccion, Transaccion
from app.models.user import Usuario

_BRAND_PREFIXES = {
    "4": "visa",
    "5": "mastercard",
    "37": "amex",
    "36": "diners",
    "6011": "discover",
    "65": "discover",
    "35": "jcb",
}


def _detectar_marca(numero: str) -> str:
    for prefijo, marca in sorted(_BRAND_PREFIXES.items(), key=lambda x: -len(x[0])):
        if numero.startswith(prefijo):
            return marca
    return "unknown"


def _validar_luhn(numero: str) -> bool:
    """Valida un número de tarjeta con el algoritmo de Luhn."""
    total = 0
    reverso = numero[::-1]
    for i, d in enumerate(reverso):
        n = int(d)
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n -= 9
        total += n
    return total % 10 == 0


class TarjetaService:

    @staticmethod
    def registrar_tarjeta(
        db: Session,
        usuario_id: UUID,
        numero_tarjeta: str,
        nombre_titular: str,
        mes_expiracion: int,
        anio_expiracion: int,
        cvv: str,
    ) -> MetodoPago:
        if not _validar_luhn(numero_tarjeta):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Número de tarjeta inválido",
            )

        now = datetime.utcnow()
        if anio_expiracion < now.year or (
            anio_expiracion == now.year and mes_expiracion < now.month
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La tarjeta está expirada",
            )

        ultimos4 = numero_tarjeta[-4:]
        marca = _detectar_marca(numero_tarjeta)

        existente = (
            db.query(MetodoPago)
            .filter(
                MetodoPago.usuario_id == usuario_id,
                MetodoPago.ultimos4 == ultimos4,
                MetodoPago.marca == marca,
                MetodoPago.mes_expiracion == mes_expiracion,
                MetodoPago.anio_expiracion == anio_expiracion,
            )
            .first()
        )
        if existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta tarjeta ya está registrada",
            )

        tiene_tarjetas = (
            db.query(MetodoPago)
            .filter(MetodoPago.usuario_id == usuario_id)
            .count()
        )

        tarjeta = MetodoPago(
            usuario_id=usuario_id,
            nombre_titular=nombre_titular.upper(),
            ultimos4=ultimos4,
            marca=marca,
            mes_expiracion=mes_expiracion,
            anio_expiracion=anio_expiracion,
            es_predeterminada=tiene_tarjetas == 0,
        )
        db.add(tarjeta)
        db.commit()
        db.refresh(tarjeta)
        return tarjeta

    @staticmethod
    def listar_tarjetas(db: Session, usuario_id: UUID) -> List[MetodoPago]:
        return (
            db.query(MetodoPago)
            .filter(MetodoPago.usuario_id == usuario_id)
            .order_by(MetodoPago.es_predeterminada.desc(), MetodoPago.creado_en.desc())
            .all()
        )

    @staticmethod
    def establecer_predeterminada(
        db: Session, usuario_id: UUID, tarjeta_id: UUID
    ) -> MetodoPago:
        tarjeta = (
            db.query(MetodoPago)
            .filter(MetodoPago.id == tarjeta_id, MetodoPago.usuario_id == usuario_id)
            .first()
        )
        if not tarjeta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tarjeta no encontrada",
            )

        db.query(MetodoPago).filter(
            MetodoPago.usuario_id == usuario_id
        ).update({"es_predeterminada": False})

        tarjeta.es_predeterminada = True
        db.commit()
        db.refresh(tarjeta)
        return tarjeta

    @staticmethod
    def eliminar_tarjeta(db: Session, usuario_id: UUID, tarjeta_id: UUID) -> None:
        tarjeta = (
            db.query(MetodoPago)
            .filter(MetodoPago.id == tarjeta_id, MetodoPago.usuario_id == usuario_id)
            .first()
        )
        if not tarjeta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tarjeta no encontrada",
            )

        era_predeterminada = tarjeta.es_predeterminada
        db.delete(tarjeta)
        db.commit()

        if era_predeterminada:
            otra = (
                db.query(MetodoPago)
                .filter(MetodoPago.usuario_id == usuario_id)
                .order_by(MetodoPago.creado_en.desc())
                .first()
            )
            if otra:
                otra.es_predeterminada = True
                db.commit()

    @staticmethod
    def recargar_con_tarjeta(
        db: Session,
        usuario_id: UUID,
        tarjeta_id: UUID,
        monto: float,
        cvv: str,
    ) -> Transaccion:
        """Recarga simulada de billetera usando una tarjeta guardada."""
        tarjeta = (
            db.query(MetodoPago)
            .filter(MetodoPago.id == tarjeta_id, MetodoPago.usuario_id == usuario_id)
            .first()
        )
        if not tarjeta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tarjeta no encontrada",
            )

        now = datetime.utcnow()
        if tarjeta.anio_expiracion < now.year or (
            tarjeta.anio_expiracion == now.year and tarjeta.mes_expiracion < now.month
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La tarjeta está expirada",
            )

        if not cvv.isdigit() or len(cvv) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CVV inválido",
            )

        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        monto_decimal = Decimal(str(monto)).quantize(Decimal("0.01"))
        usuario.saldo_billetera = (usuario.saldo_billetera or Decimal("0")) + monto_decimal

        transaccion = Transaccion(
            usuario_id=usuario_id,
            tipo=TipoTransaccion.recarga_billetera,
            monto=monto_decimal,
            estado=EstadoTransaccion.completada,
            meta={
                "metodo": "tarjeta_guardada",
                "tarjeta_id": str(tarjeta_id),
                "marca": tarjeta.marca,
                "ultimos4": tarjeta.ultimos4,
            },
        )
        db.add(transaccion)
        db.commit()
        db.refresh(transaccion)
        return transaccion
