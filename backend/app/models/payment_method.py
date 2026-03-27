"""Modelo de métodos de pago (tarjetas) guardados por el usuario."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class MetodoPago(Base):
    __tablename__ = "metodos_pago"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    usuario_id = Column(
        UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False, index=True
    )

    nombre_titular = Column(String(150), nullable=False)
    ultimos4 = Column(String(4), nullable=False)
    marca = Column(String(30), nullable=False)  # visa, mastercard, amex, etc.
    mes_expiracion = Column(Integer, nullable=False)
    anio_expiracion = Column(Integer, nullable=False)
    es_predeterminada = Column(Boolean, default=False, nullable=False)

    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    usuario = relationship("Usuario", back_populates="metodos_pago")
