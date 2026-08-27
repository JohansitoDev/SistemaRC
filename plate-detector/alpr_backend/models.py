from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Plate(Base):
    __tablename__ = 'plates'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plate_number: Mapped[str] = mapped_column(String(255), index=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime)
    is_stolen: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str | None] = mapped_column(String(255), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)


class StolenPlate(Base):
    __tablename__ = 'stolen_plates'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plate_number: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)
