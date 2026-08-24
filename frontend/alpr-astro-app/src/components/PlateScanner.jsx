import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api/plates';
const ALPR_URL = import.meta.env.PUBLIC_ALPR_URL || 'http://localhost:8001';

export default function PlateScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [detectedPlate, setDetectedPlate] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Encender Cámara Web
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Este navegador no permite acceder a la cámara. Abre el sitio por HTTPS.');
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1080 }, height: { ideal: 1080 } }
        });
      } catch (firstError) {
        if (firstError.name !== 'NotReadableError' && firstError.name !== 'OverconstrainedError') {
          throw firstError;
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setCapturedImage(null);
        setStatusMessage('Cámara activa. Coloca la placa dentro del recuadro.');
      }
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      const cameraMessages = {
        NotAllowedError: 'Permiso de cámara bloqueado. Actívalo en el candado de la dirección del navegador.',
        NotFoundError: 'No se encontró ninguna cámara conectada.',
        NotReadableError: 'La cámara está siendo usada por otra aplicación. Cierra Teams, Zoom, OBS u otra pestaña que la use y vuelve a intentar.',
        SecurityError: 'La cámara necesita HTTPS o localhost para funcionar.',
      };
      setStatusMessage(cameraMessages[err.name] || err.message || 'No se pudo acceder a la cámara web.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Enviar el cuadro completo permite detectar placas fuera del centro del visor.
  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current || processing) return;

    setProcessing(true);
    setStatusMessage('Capturando foto y analizando caracteres...');
    setCurrentAlert(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    if (!videoWidth || !videoHeight) {
      setProcessing(false);
      setStatusMessage('La cámara todavía no está lista. Espera un momento y vuelve a capturar.');
      return;
    }

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    context.drawImage(video, 0, 0, videoWidth, videoHeight);

    const imagePreviewUrl = canvas.toDataURL('image/png');
    setCapturedImage(imagePreviewUrl);

    try {
      const imageBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo preparar la captura.'))), 'image/jpeg', 0.95);
      });
      const formData = new FormData();
      formData.append('file', imageBlob, 'plate-capture.jpg');

      let detectorResponse;
      try {
        detectorResponse = await fetch(`${ALPR_URL}/scan`, { method: 'POST', body: formData });
      } catch (detectorError) {
        throw new Error(`Detector apagado o inaccesible en ${ALPR_URL}. Inicia el servidor FastAPI y verifica PUBLIC_ALPR_URL.`);
      }
      const detectorData = await detectorResponse.json();
      if (!detectorResponse.ok) {
        throw new Error(detectorData.detail || 'FastALPR no pudo leer la matrícula.');
      }

      const rawClean = (detectorData.plate_number || '').trim().toUpperCase();
      if (!rawClean) {
        throw new Error('El detector no pudo leer los caracteres de la placa.');
      }
      setDetectedPlate(rawClean);

      setStatusMessage(`Matrícula detectada: ${rawClean}. Guardando en base de datos...`);

      // Enviar a Laravel Backend
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          plate_number: rawClean,
          captured_at: new Date().toISOString()
        })
      });

      const resData = await response.json();
      const apiRecord = resData.plate || resData;

      if (!response.ok && resData.status !== 'DUPLICATE') {
        throw new Error(resData.message || `Error en el servidor: ${response.status}`);
      }

      const record = {
        plate_number: apiRecord.plate_number || rawClean,
        captured_at: apiRecord.captured_at || new Date().toLocaleString(),
        is_stolen: apiRecord.is_stolen,
        status: resData.status || apiRecord.status || 'SAVED',
        message: resData.message || apiRecord.message
      };

      const stored = JSON.parse(localStorage.getItem('offline_plates') || '[]');
      localStorage.setItem('offline_plates', JSON.stringify([record, ...stored]));

      if (record.is_stolen) {
        setCurrentAlert(record);
        setStatusMessage('¡ALERTA CRÍTICA: Vehículo con reporte de robo!');
      } else if (record.status === 'DUPLICATE') {
        setStatusMessage('Placa duplicada (registrada recientemente).');
      } else {
        setStatusMessage('Placa registrada exitosamente en MySQL.');
      }
    } catch (error) {
      console.error('Error procesando OCR o API:', error);
      setStatusMessage(error.message || 'No se pudo procesar la captura.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Alerta Crítica por Robo */}
      {currentAlert && (
        <div className="bg-rose-600 text-white p-5 rounded-2xl flex items-center gap-4 shadow-lg shadow-rose-600/20 animate-bounce">
          <ShieldAlert className="w-10 h-10 text-white" />
          <div>
            <span className="bg-white text-rose-700 text-[10px] font-black uppercase px-2 py-0.5 rounded">
              Alerta de Seguridad
            </span>
            <h3 className="text-xl font-black mt-1">¡VEHÍCULO REPORTADO COMO ROBADO!</h3>
            <p className="text-sm font-semibold text-rose-100">
              Matrícula: <span className="bg-black/30 font-mono px-2 py-0.5 rounded text-yellow-300">{currentAlert.plate_number}</span>
            </p>
          </div>
        </div>
      )}

      {/* Grid del Escáner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visor de Cámara Cuadrado (2x2) / Vista previa */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Visor de Cámara (2x2)</span>
            </h3>

            {!isCameraActive ? (
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all"
              >
                Activar Cámara
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold text-xs rounded-xl transition-all"
              >
                Detener Cámara
              </button>
            )}
          </div>

          {/* Contenedor de Relación de Aspecto 2x2 Estricta (aspect-square) */}
          <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-slate-800">
            {capturedImage ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                <img src={capturedImage} alt="Foto Capturada" className="w-full h-full object-contain" />
                <div className="absolute bottom-3 bg-black/70 text-white text-[10px] px-3 py-1 rounded-full font-bold">
                  Captura cuadrada 2x2 analizada
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isCameraActive && 'hidden'}`}
              />
            )}

            {!isCameraActive && !capturedImage && (
              <div className="text-center p-6 text-slate-500 space-y-2">
                <Camera className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-sm font-medium">Cámara desactivada. Haz clic en "Activar Cámara".</p>
              </div>
            )}

            {/* Guía visual interna también cuadrada (2x2) */}
            {isCameraActive && !capturedImage && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="absolute top-[43%] w-[88%] h-[50%] border-2 border-dashed border-yellow-400 rounded-xl bg-yellow-400/10 flex items-center justify-center shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-yellow-200 bg-black/70 px-2 py-1 rounded text-center">
                    Coloca la placa dentro del recuadro
                  </span>
                </div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {capturedImage ? (
            <button
              onClick={() => {
                setCapturedImage(null);
                setDetectedPlate('');
                setStatusMessage('');
              }}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Tomar Otra Fotografía</span>
            </button>
          ) : (
            <button
              onClick={captureAndScan}
              disabled={!isCameraActive || processing}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Procesando imagen 2x2...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>Capturar y Extraer Matrícula</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Panel Lateral */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3 text-base">
              Resultado de la Captura
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Matrícula Extraída</label>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="font-mono font-black text-3xl tracking-widest text-slate-900">
                  {detectedPlate || '--- ---'}
                </span>
              </div>
            </div>

            {statusMessage && (
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs font-semibold text-blue-700 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}