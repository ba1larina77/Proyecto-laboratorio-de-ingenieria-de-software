"""Schemas Pydantic para gestión de tarjetas guardadas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class TarjetaCrear(BaseModel):
    """Datos que envía el cliente al registrar una tarjeta."""
    numero_tarjeta: str
    nombre_titular: str
    mes_expiracion: int
    anio_expiracion: int
    cvv: str

    @field_validator("numero_tarjeta")
    @classmethod
    def validar_numero(cls, v: str) -> str:
        limpio = v.replace(" ", "").replace("-", "")
        if not limpio.isdigit() or len(limpio) < 13 or len(limpio) > 19:
            raise ValueError("Número de tarjeta inválido")
        return limpio

    @field_validator("nombre_titular")
    @classmethod
    def validar_nombre(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("El nombre del titular es obligatorio")
        return v.strip()

    @field_validator("mes_expiracion")
    @classmethod
    def validar_mes(cls, v: int) -> int:
        if v < 1 or v > 12:
            raise ValueError("Mes de expiración inválido")
        return v

    @field_validator("anio_expiracion")
    @classmethod
    def validar_anio(cls, v: int) -> int:
        if v < 2024 or v > 2050:
            raise ValueError("Año de expiración inválido")
        return v

    @field_validator("cvv")
    @classmethod
    def validar_cvv(cls, v: str) -> str:
        if not v.isdigit() or len(v) < 3 or len(v) > 4:
            raise ValueError("CVV inválido")
        return v


class TarjetaRespuesta(BaseModel):
    """Datos de una tarjeta guardada (sin datos sensibles)."""
    id: UUID
    nombre_titular: str
    ultimos4: str
    marca: str
    mes_expiracion: int
    anio_expiracion: int
    es_predeterminada: bool
    creado_en: datetime

    model_config = {"from_attributes": True}


class EstablecerPredeterminada(BaseModel):
    tarjeta_id: UUID


class RecargaConTarjeta(BaseModel):
    """Recarga de billetera usando una tarjeta guardada (simulado)."""
    tarjeta_id: UUID
    monto: float
    cvv: str

    @field_validator("monto")
    @classmethod
    def validar_monto(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a cero")
        if v > 500000:
            raise ValueError("La recarga máxima es $500.000 COP")
        return v

    @field_validator("cvv")
    @classmethod
    def validar_cvv(cls, v: str) -> str:
        if not v.isdigit() or len(v) < 3 or len(v) > 4:
            raise ValueError("CVV inválido")
        return v
