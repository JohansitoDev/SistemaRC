# Detector ALPR

## Preparar modelos

Copia los pesos de deteccion de placas compatibles con Ultralytics YOLO en `models/`:

```text
plate-detector/
  models/
    modelo_placas_1.pt
    modelo_placas_2.pt
```

El servidor carga automaticamente todos los `.pt`. Tambien puedes indicar rutas concretas:

```powershell
$env:ALPR_MODELS='modeloA=models/modelo_placas_1.pt,modeloB=C:/modelos/otro.pt'
```

## Ejecutar

Ejecuta desde `plate-detector`:

```powershell
Set-Location plate-detector
python -m pip install -r requirements.txt
python -m uvicorn server:app --host 0.0.0.0 --port 8001
```

Comprueba `https://localhost:8001/health`. El frontend usa `PUBLIC_ALPR_URL` y envia la imagen capturada a `/scan`.

## Prueba con varios modelos

El servidor carga todos los archivos `.pt` de `models/` y evalua cada uno sobre la imagen completa. Para cada modelo conserva varias cajas, activa TTA por defecto y prueba cuatro variantes de OCR: ampliada, contraste local, enfocada y umbralizada. La respuesta incluye `detections` y `candidates` para comparar modelos y ver el consenso.

Variables opcionales para ajustar la prueba:

```powershell
$env:ALPR_CONFIDENCE='0.15'
$env:ALPR_IMAGE_SIZE='960'
$env:ALPR_MAX_DETECTIONS_PER_MODEL='5'
$env:ALPR_OCR_UPSCALE='3'
$env:ALPR_USE_TTA='true'
```

Para comparar pesos concretos, asigna nombres distintos con `ALPR_MODELS`:

```powershell
$env:ALPR_MODELS='general=models/modelo_general.pt,distancia=models/modelo_distancia.pt,sucias=C:/modelos/modelo_sucias.pt'
python -m uvicorn server:app --host 0.0.0.0 --port 8001
```

La precision real depende de los datos de entrenamiento. Incluye en `dataset/` capturas con placas limpias, sucias, borrosas, lejanas, inclinadas y con poca luz, y usa el notebook `evaluar_modelos_placas.ipynb` para medir cada peso con las mismas imagenes.
