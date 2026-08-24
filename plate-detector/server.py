import os
import re
import time
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

try:
    import easyocr
except ImportError:
    easyocr = None

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / 'models'
CONFIDENCE = float(os.getenv('ALPR_CONFIDENCE', '0.25'))
IMAGE_SIZE = int(os.getenv('ALPR_IMAGE_SIZE', '640'))
MAX_DETECTIONS_PER_MODEL = int(os.getenv('ALPR_MAX_DETECTIONS_PER_MODEL', '5'))
OCR_UPSCALE = float(os.getenv('ALPR_OCR_UPSCALE', '3'))
USE_TTA = os.getenv('ALPR_USE_TTA', 'true').lower() in {'1', 'true', 'yes'}

app = FastAPI(title='ALPR detector')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv('ALPR_CORS_ORIGINS', 'https://localhost:4321,http://localhost:4321').split(',')],
    allow_credentials=False,
    allow_methods=['GET', 'POST'],
    allow_headers=['*'],
)


def configured_model_paths():
    configured = os.getenv('ALPR_MODELS', '')
    if configured:
        paths = []
        for item in configured.split(','):
            name, separator, raw_path = item.partition('=')
            path = Path(raw_path.strip() if separator else name.strip())
            paths.append((name.strip() if separator else path.stem, path if path.is_absolute() else BASE_DIR / path))
        return paths
    return [(path.stem, path) for path in sorted(MODELS_DIR.glob('*.pt'))]


def load_models():
    loaded = {}
    if YOLO is None:
        return loaded
    for name, path in configured_model_paths():
        if not path.exists():
            print(f'Modelo no encontrado: {path}')
            continue
        try:
            loaded[name] = YOLO(str(path))
            print(f'Modelo cargado: {name}')
        except Exception as error:
            print(f'No se pudo cargar {name}: {error}')
    return loaded


models = load_models()
ocr_reader = None


def clean_plate(text):
    return re.sub(r'[^A-Z0-9]', '', text.upper())


def prepare_ocr_variants(crop):
    if crop.size == 0:
        return []
    height, width = crop.shape[:2]
    enlarged = cv2.resize(
        crop,
        (max(1, int(width * OCR_UPSCALE)), max(1, int(height * OCR_UPSCALE))),
        interpolation=cv2.INTER_CUBIC,
    )
    gray = cv2.cvtColor(enlarged, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
    denoised = cv2.fastNlMeansDenoising(clahe, None, 7, 7, 21)
    sharpened = cv2.addWeighted(denoised, 1.7, cv2.GaussianBlur(denoised, (0, 0), 3), -0.7, 0)
    threshold = cv2.adaptiveThreshold(
        sharpened, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 9
    )
    return [enlarged, clahe, sharpened, threshold]


def read_plate_text(crop):
    global ocr_reader
    if easyocr is None or crop.size == 0:
        return {'text': '', 'confidence': 0.0}
    if ocr_reader is None:
        ocr_reader = easyocr.Reader(['es', 'en'], gpu=False)
    candidates = []
    for variant in prepare_ocr_variants(crop):
        values = ocr_reader.readtext(
            variant,
            detail=1,
            paragraph=False,
            allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            mag_ratio=1.0,
        )
        for _, raw_text, confidence in values:
            text = clean_plate(raw_text)
            if len(text) >= 3:
                candidates.append((text, float(confidence)))
    return max(candidates, key=lambda item: item[1], default=('', 0.0))


@app.get('/health')
def health():
    return {'status': 'ok', 'models': list(models), 'ocr': easyocr is not None}


@app.post('/scan')
async def scan(file: UploadFile = File(...)):
    if not models:
        raise HTTPException(status_code=503, detail='No hay modelos .pt cargados en plate-detector/models.')
    content = await file.read()
    image = cv2.imdecode(np.frombuffer(content, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail='El archivo recibido no es una imagen valida.')

    detections = []
    for model_name, model in models.items():
        started = time.perf_counter()
        prediction = model.predict(
            source=image,
            conf=CONFIDENCE,
            imgsz=IMAGE_SIZE,
            augment=USE_TTA,
            max_det=MAX_DETECTIONS_PER_MODEL,
            verbose=False,
        )[0]
        elapsed_ms = (time.perf_counter() - started) * 1000
        if prediction.boxes is None or len(prediction.boxes) == 0:
            continue
        boxes = prediction.boxes.xyxy.cpu().numpy()
        confidences = prediction.boxes.conf.cpu().numpy()
        for box, detection_confidence in zip(boxes, confidences):
            x1, y1, x2, y2 = [int(value) for value in box]
            x1 = max(0, min(x1, image.shape[1] - 1))
            y1 = max(0, min(y1, image.shape[0] - 1))
            x2 = max(x1 + 1, min(x2, image.shape[1]))
            y2 = max(y1 + 1, min(y2, image.shape[0]))
            crop = image[y1:y2, x1:x2]
            ocr_text, ocr_confidence = read_plate_text(crop)
            detections.append({
                'model': model_name,
                'confidence': float(detection_confidence),
                'ocr_confidence': round(ocr_confidence, 4),
                'box': [x1, y1, x2, y2],
                'ocr': ocr_text,
                'time_ms': round(elapsed_ms, 2),
            })

    votes = {}
    for detection in detections:
        if detection['ocr']:
            votes.setdefault(detection['ocr'], set()).add(detection['model'])
    for detection in detections:
        model_votes = len(votes.get(detection['ocr'], set()))
        detection['score'] = round(
            detection['confidence'] * 0.55
            + detection['ocr_confidence'] * 0.35
            + min(model_votes, 3) * 0.1,
            4,
        )

    detections.sort(key=lambda item: item['score'], reverse=True)
    best = next((item for item in detections if item['ocr']), detections[0] if detections else None)
    if best is None:
        raise HTTPException(status_code=422, detail='No se detecto ninguna placa.')
    if not best['ocr']:
        raise HTTPException(status_code=422, detail='Se detecto una placa, pero no se pudieron leer sus caracteres.')

    return {
        'plate_number': best['ocr'],
        'confidence': best['confidence'],
        'box': best['box'],
        'model': best['model'],
        'detections': detections,
        'candidates': [
            {'plate_number': text, 'models': sorted(model_names), 'votes': len(model_names)}
            for text, model_names in sorted(votes.items(), key=lambda item: len(item[1]), reverse=True)
        ],
    }
