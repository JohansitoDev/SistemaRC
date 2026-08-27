from datetime import datetime
from io import BytesIO
import logging
import re

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image
from sqlalchemy import desc, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from .database import engine
from .models import Plate, StolenPlate, User
from .ocr import detect_plate
from .schemas import PlatePayload
from .auth import create_access_token, hash_password, verify_password
from .user_schemas import LoginPayload, RegisterPayload

router = APIRouter()
logger = logging.getLogger(__name__)


def normalize_plate(value: str) -> str:
    return re.sub(r'[^A-Z0-9]', '', value.upper().strip())


@router.post('/api/register', status_code=201)
def register(payload: RegisterPayload) -> dict[str, object]:
    email = str(payload.email).lower()
    try:
        with Session(engine) as session:
            if session.scalar(select(User).where(User.email == email)):
                raise HTTPException(status_code=409, detail='Ya existe una cuenta con ese correo electrónico.')

            user = User(name=payload.name.strip(), email=email, password=hash_password(payload.password))
            session.add(user)
            session.commit()
            session.refresh(user)
            token = create_access_token(user.id, user.email)
            return {
                'access_token': token,
                'token_type': 'bearer',
                'user': {'id': user.id, 'name': user.name, 'email': user.email},
            }
    except HTTPException:
        raise
    except SQLAlchemyError as error:
        logger.exception('Error registrando usuario en PostgreSQL.')
        raise HTTPException(status_code=503, detail='No se pudo crear la cuenta.') from error


@router.post('/api/login')
def login(payload: LoginPayload) -> dict[str, object]:
    email = str(payload.email).lower()
    try:
        with Session(engine) as session:
            user = session.scalar(select(User).where(User.email == email))
            if not user or not verify_password(payload.password, user.password):
                raise HTTPException(status_code=401, detail='Correo o contraseña incorrectos.')

            return {
                'access_token': create_access_token(user.id, user.email),
                'token_type': 'bearer',
                'user': {'id': user.id, 'name': user.name, 'email': user.email},
            }
    except HTTPException:
        raise
    except SQLAlchemyError as error:
        logger.exception('Error autenticando usuario en PostgreSQL.')
        raise HTTPException(status_code=503, detail='No se pudo iniciar sesión.') from error


@router.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


@router.get('/')
def root() -> dict[str, str]:
    return {'service': 'ALPR backend', 'status': 'ok', 'endpoint': '/scan'}


@router.post('/scan')
async def scan(file: UploadFile = File(...)) -> dict[str, str | float]:
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=415, detail='El archivo debe ser una imagen.')

    try:
        contents = await file.read()
        image = np.array(Image.open(BytesIO(contents)).convert('RGB'))
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    except Exception as error:
        raise HTTPException(status_code=400, detail='No se pudo leer la imagen.') from error

    plate, confidence = await run_in_threadpool(detect_plate, image)
    if not plate:
        raise HTTPException(status_code=422, detail='No se detectó una matrícula. Acerca la placa y evita reflejos.')

    return {'plate_number': plate, 'confidence': round(confidence, 4)}


@router.post('/api/plates', status_code=201)
def create_plate(payload: PlatePayload) -> dict[str, object]:
    plate_number = normalize_plate(payload.plate_number)
    if len(plate_number) < 3 or len(plate_number) > 20:
        raise HTTPException(status_code=422, detail='La placa debe contener entre 3 y 20 caracteres alfanuméricos.')

    captured_at = payload.captured_at or datetime.now()
    try:
        with Session(engine) as session:
            stolen_record = session.scalar(
                select(StolenPlate).where(StolenPlate.plate_number == plate_number)
            )
            is_stolen = stolen_record is not None
            status = 'ROBADA' if is_stolen else 'REGISTRADA'
            message = (
                f'Alerta: {stolen_record.notes or "Vehículo reportado como robado"}'
                if stolen_record
                else 'Matrícula procesada correctamente'
            )
            plate = Plate(
                plate_number=plate_number,
                captured_at=captured_at,
                is_stolen=is_stolen,
                status=status,
                message=message,
            )
            session.add(plate)
            session.commit()
            session.refresh(plate)
            return {
                'success': True,
                'status': status,
                'plate_number': plate.plate_number,
                'is_stolen': is_stolen,
                'captured_at': plate.captured_at.isoformat(sep=' '),
                'message': message,
                'plate': {
                    'id': plate.id,
                    'plate_number': plate.plate_number,
                    'captured_at': plate.captured_at.isoformat(sep=' '),
                    'is_stolen': is_stolen,
                    'status': status,
                    'message': message,
                },
            }
    except SQLAlchemyError as error:
        logger.exception('Error guardando matrícula en PostgreSQL.')
        raise HTTPException(status_code=503, detail='No se pudo guardar la matrícula en la base de datos.') from error


@router.get('/api/plates')
def list_plates() -> list[dict[str, object]]:
    try:
        with Session(engine) as session:
            plates = session.scalars(select(Plate).order_by(desc(Plate.id))).all()
            return [
                {
                    'id': plate.id,
                    'plate_number': plate.plate_number,
                    'captured_at': plate.captured_at.isoformat(sep=' '),
                    'is_stolen': bool(plate.is_stolen),
                    'status': plate.status,
                    'message': plate.message,
                }
                for plate in plates
            ]
    except SQLAlchemyError as error:
        logger.exception('Error consultando historial en PostgreSQL.')
        raise HTTPException(status_code=503, detail='No se pudo consultar el historial.') from error


@router.get('/api/plates/stats')
def plate_stats() -> dict[str, int]:
    try:
        with Session(engine) as session:
            total = session.scalar(select(func.count()).select_from(Plate)) or 0
            stolen = session.scalar(
                select(func.count()).select_from(Plate).where(Plate.is_stolen.is_(True))
            ) or 0
            return {'total': total, 'stolen': stolen, 'normal': total - stolen}
    except SQLAlchemyError as error:
        logger.exception('Error consultando estadísticas en PostgreSQL.')
        raise HTTPException(status_code=503, detail='No se pudieron consultar las estadísticas.') from error
