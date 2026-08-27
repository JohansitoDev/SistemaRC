from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase

from .config import database_url


class Base(DeclarativeBase):
    pass


engine = create_engine(database_url(), pool_pre_ping=True)


def init_database() -> None:
    from . import models

    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(text('ALTER TABLE plates ADD COLUMN IF NOT EXISTS is_stolen BOOLEAN DEFAULT FALSE'))
        connection.execute(text('ALTER TABLE plates ADD COLUMN IF NOT EXISTS status VARCHAR(255)'))
        connection.execute(text('ALTER TABLE plates ADD COLUMN IF NOT EXISTS message TEXT'))
        connection.execute(text('ALTER TABLE stolen_plates ADD COLUMN IF NOT EXISTS notes VARCHAR(255)'))
