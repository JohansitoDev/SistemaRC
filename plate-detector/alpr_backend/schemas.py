from datetime import datetime

from pydantic import BaseModel


class PlatePayload(BaseModel):
    plate_number: str
    captured_at: datetime | None = None
