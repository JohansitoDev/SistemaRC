import re

import cv2
import easyocr
import numpy as np

reader = easyocr.Reader(['en', 'es'], gpu=False)


def clean_plate_text(value: str) -> str:
    return re.sub(r'[^A-Z0-9]', '', value.upper())


def image_variants(image: np.ndarray) -> list[np.ndarray]:
    height, width = image.shape[:2]
    regions = [
        image,
        image[int(height * 0.2):int(height * 0.95), int(width * 0.05):int(width * 0.95)],
        image[int(height * 0.35):int(height * 0.95), int(width * 0.15):int(width * 0.85)],
    ]
    variants = []
    for region in regions:
        region_height, region_width = region.shape[:2]
        scale = max(2, min(5, 1800 // max(region_width, region_height)))
        resized = cv2.resize(region, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        contrast = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8)).apply(gray)
        threshold = cv2.threshold(contrast, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        adaptive = cv2.adaptiveThreshold(contrast, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11)
        variants.extend([resized, gray, contrast, threshold, adaptive])
    return variants


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
            if 3 <= len(cleaned) <= 10 and confidence >= 0.15:
                candidates.append((cleaned, float(confidence)))

    if not candidates:
        return None, 0.0

    grouped: dict[str, list[float]] = {}
    for text, confidence in candidates:
        grouped.setdefault(text, []).append(confidence)
    best_text = max(grouped, key=lambda text: (len(grouped[text]), max(grouped[text]), len(text)))
    return best_text, max(grouped[best_text])
