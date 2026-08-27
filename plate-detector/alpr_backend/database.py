from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase

from .config import database_url


class Base(DeclarativeBase):
    pass


engine = create_engine(database_url(), pool_pre_ping=True)
