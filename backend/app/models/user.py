from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, DateTime, Enum, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid


from app.database import Base


class Rol(str, PyEnum):
    root = "root"
    administrador = "administrador"
    cliente = "cliente"
    visitante = "visitante"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    dni = Column(String(20), unique=True, nullable=False, index=True)
    nombres = Column(String(100), nullable=False)
    apellidos = Column(String(100), nullable=False)
    fecha_nacimiento = Column(String(10), nullable=True)
    lugar_nacimiento = Column(String(150), nullable=True)
    direccion = Column(Text, nullable=True)
    genero = Column(String(20), nullable=True)
    correo = Column(String(255), unique=True, nullable=False, index=True)
    usuario = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    temas_preferencia = Column(Text, nullable=True)  # JSON serializado
    rol = Column(Enum(Rol), default=Rol.cliente, nullable=False)
    saldo_billetera = Column(Numeric(10, 2), nullable=False, default=0)
    esta_activo = Column(Boolean, default=True, nullable=False)
    # Bloqueo administrativo (independiente de esta_activo)
    bloqueado = Column(Boolean, default=False, nullable=False)
    motivo_bloqueo = Column(String(500), nullable=True)
    bloqueado_en = Column(DateTime, nullable=True)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)
    actualizado_en = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reservas = relationship("Reserva", back_populates="usuario", lazy="dynamic")
    pedidos = relationship("Pedido", back_populates="usuario", lazy="dynamic")
    transacciones = relationship("Transaccion", back_populates="usuario", lazy="dynamic")
    solicitudes_devolucion = relationship(
        "SolicitudDevolucion", back_populates="usuario", lazy="dynamic"
    )
    metodos_pago = relationship(
        "MetodoPago", back_populates="usuario", lazy="dynamic",
        order_by="MetodoPago.creado_en.desc()",
    )
