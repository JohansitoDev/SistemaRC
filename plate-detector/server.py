from io import BytesIO
import re

import cv2
import easyocr
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app = FastAPI(title='ALPR detector')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)

reader = easyocr.Reader(['en', 'es'], gpu=False)


def clean_plate_text(value: str) -> str:
    return re.sub(r'[^A-Z0-9]', '', value.upper())


def image_variants(image: np.ndarray) -> list[np.ndarray]:
    height, width = image.shape[:2]
    scale = max(2, min(4, 1600 // max(width, height)))
    resized = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    contrast = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8)).apply(gray)
    threshold = cv2.threshold(contrast, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    adaptive = cv2.adaptiveThreshold(contrast, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11)
    return [resized, gray, contrast, threshold, adaptive]


def detect_plate(image: np.ndarray) -> tuple[str | None, float]:
    candidates: list[tuple[str, float]] = []
    for variant in image_variants(image):
        results = reader.readtext(
            variant,
            allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            detail=1,
            paragraph=False,
            mag_ratio=1.5,
        )
        for _, text, confidence in results:
            cleaned = clean_plate_text(text)
            # This range covers common private-vehicle formats internationally.
            if 3 <= len(cleaned) <= 10 and confidence >= 0.15:
                candidates.append((cleaned, float(confidence)))

    if not candidates:
        return None, 0.0

    grouped: dict[str, list[float]] = {}
    for text, confidence in candidates:
        grouped.setdefault(text, []).append(confidence)
    best_text = max(grouped, key=lambda text: (len(grouped[text]), max(grouped[text]), len(text)))
    return best_text, max(grouped[best_text])


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


@app.get('/')
def root() -> dict[str, str]:
    return {'service': 'ALPR detector', 'status': 'ok', 'endpoint': '/scan'}


@app.post('/scan')
async def scan(file: UploadFile = File(...)) -> dict[str, str | float]:
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=415, detail='El archivo debe ser una imagen.')

    try:
        contents = await file.read()
        image = np.array(Image.open(BytesIO(contents)).convert('RGB'))
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    except Exception as error:
        raise HTTPException(status_code=400, detail='No se pudo leer la imagen.') from error

    plate, confidence = detect_plate(image)
    if not plate:
        raise HTTPException(status_code=422, detail='No se detectó una matrícula. Acerca la placa y evita reflejos.')

    return {'plate_number': plate, 'confidence': round(confidence, 4)}
