import cv2
import numpy as np
import streamlit as st
from PIL import Image
import easyocr
import re

st.set_page_config(page_title="Lector de Placas ALPR", layout="centered")
st.title(" Lector de Placas Vehiculares")

@st.cache_resource
def load_ocr():
    return easyocr.Reader(['en', 'es'], gpu=False)

reader = load_ocr()

def preprocess_plate(cropped_image):
    """
    Preprocesa la imagen recortando la franja superior y 
    aumentando el contraste para aislar los números principales.
    """
    h, w, _ = cropped_image.shape
    
    # 1. Recortar la franja superior (ignora 'REP. DOMINICANA')
    # Tomamos desde el 25% hasta el 95% de la altura de la imagen
    roi = cropped_image[int(h * 0.25):int(h * 0.95), 0:w]

    # 2. Convertir a escala de grises
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    
    # 3. Redimensionar para magnificar caracteres
    resized = cv2.resize(gray, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
    
    # 4. Ajuste adaptativo de contraste (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(resized)

   
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    return binary

def clean_plate_text(text):
    """Limpia la cadena dejando únicamente letras y números."""
    return re.sub(r'[^A-Z0-9]', '', text.upper())


input_mode = st.radio("Elige la fuente de imagen:", ("Cámara web", "Subir imagen"))

image_bytes = None
if input_mode == "Cámara web":
    image_bytes = st.camera_input("Apunta tu cámara hacia la placa")
elif input_mode == "Subir imagen":
    image_bytes = st.file_uploader("Sube una foto de la placa", type=["jpg", "jpeg", "png"])

if image_bytes is not None:
    image = Image.open(image_bytes)
    img_np = np.array(image)
    img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

   
    st.subheader("Imagen Entrante")
    st.image(image, use_container_width=True)

   
    processed_img = preprocess_plate(img_cv)

    
    results = reader.readtext(
        processed_img,
        allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        paragraph=False
    )

    detected_candidates = []
    for bbox, text, prob in results:
        cleaned = clean_plate_text(text)
        
        if len(cleaned) >= 5 and prob > 0.10:
            detected_candidates.append((cleaned, prob, len(cleaned)))

    st.markdown("---")
    if detected_candidates:
      
        best_match = max(detected_candidates, key=lambda x: (x[2], x[1]))
        st.success(f"**PLACA DETECTADA:** `{best_match[0]}`")
        st.info(f"**Nivel de confianza:** {best_match[1]*100:.2f}%")
    else:
        st.warning("No se logró extraer el número de placa principal. Asegúrate de encuadrar bien la matrícula.")