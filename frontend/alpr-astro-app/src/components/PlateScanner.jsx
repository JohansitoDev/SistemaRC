import React, { useRef, useState, useEffect } from 'react';
import { Camera, ShieldAlert, Upload, X } from 'lucide-react';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api/plates';
const ALPR_URL = import.meta.env.PUBLIC_ALPR_URL || 'http://localhost:8001';

export default function PlateScanner() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [detectedPlate, setDetectedPlate] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const scanImage = async (imageBlob) => {
    setProcessing(true);
    setStatusMessage('Analizando imagen...');
    setCurrentAlert(null);

    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'plate-image.jpg');

      let detectorResponse;
      try {
        detectorResponse = await fetch(`${ALPR_URL}/scan`, { method: 'POST', body: formData });
      } catch {
        throw new Error('Detector no disponible.');
      }
      const detectorData = await detectorResponse.json();
      if (!detectorResponse.ok) throw new Error(detectorData.detail || 'Matrícula no detectada.');

      const rawClean = (detectorData.plate_number || '').trim().toUpperCase();
      if (!rawClean) throw new Error('No se detectaron caracteres.');

      setDetectedPlate(rawClean);
      setConfidence(typeof detectorData.confidence === 'number' ? detectorData.confidence : null);
      setStatusMessage(`Placa: ${rawClean}`);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ plate_number: rawClean, captured_at: new Date().toISOString() })
      });

      const resData = await response.json();
      const apiRecord = resData.plate || resData;
      if (!response.ok && resData.status !== 'DUPLICATE') throw new Error(resData.error || resData.message || 'Error del servidor.');

      if (apiRecord.is_stolen) {
        setCurrentAlert(apiRecord);
        setStatusMessage('Vehículo reportado como robado.');
      } else {
        setStatusMessage('Matrícula registrada correctamente.');
      }
    } catch (error) {
      console.error(error);
      setStatusMessage(error.message || 'Error al procesar.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result);
      setDetectedPlate('');
      setConfidence(null);
      scanImage(file);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Navegador no compatible con cámara.');
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1080 }, height: { ideal: 1080 } }
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setCapturedImage(null);
        setDetectedPlate('');
        setConfidence(null);
        setStatusMessage('Cámara activa.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('No se pudo acceder a la cámara.');
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

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current || processing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    if (!videoWidth || !videoHeight) {
      setStatusMessage('Cámara no lista.');
      return;
    }

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    context.drawImage(video, 0, 0, videoWidth, videoHeight);

    const imagePreviewUrl = canvas.toDataURL('image/png');
    setCapturedImage(imagePreviewUrl);

    const imageBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Error en captura.'))), 'image/jpeg', 0.95);
    });
    scanImage(imageBlob);
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-3xl flex-col items-center justify-center px-2 py-8">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
          <Camera className="h-7 w-7" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">¿Qué placa quieres consultar?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Sube una fotografía o activa la cámara para identificar una matrícula.</p>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />

      {(isCameraActive || capturedImage) && (
        <div className="relative mb-6 w-full max-w-xl overflow-hidden rounded-3xl bg-slate-950 p-2 shadow-xl shadow-slate-900/10">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
          {capturedImage ? (
            <img src={capturedImage} alt="Captura" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isCameraActive && 'hidden'}`}
            />
          )}
          {isCameraActive && !capturedImage && <div className="pointer-events-none absolute inset-8 rounded-2xl border border-white/50" />}
          </div>
          <button type="button" onClick={() => { stopCamera(); setCapturedImage(null); setDetectedPlate(''); setConfidence(null); setStatusMessage(''); }} className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm hover:bg-black/70" aria-label="Cerrar visor">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {detectedPlate && <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-center"><span className="font-mono text-2xl font-bold tracking-wider text-emerald-800">{detectedPlate}</span>{confidence !== null && <p className="mt-1 text-xs font-semibold text-emerald-700">Precisión: {(confidence * 100).toFixed(1)}%</p>}</div>}

      {currentAlert && <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600"><ShieldAlert className="h-4 w-4" /><span>Vehículo reportado como robado</span></div>}

      {statusMessage && !currentAlert && <p className="mb-5 text-center text-xs font-medium text-slate-500">{statusMessage}</p>}

      <div className="flex w-full max-w-xl flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition-transform hover:-translate-y-0.5">
          <Upload className="h-4 w-4" /> Subir foto
        </button>
        <button type="button" onClick={isCameraActive ? captureAndScan : startCamera} disabled={processing} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:text-slate-950 disabled:opacity-50">
          <Camera className="h-4 w-4" /> {isCameraActive ? (processing ? 'Escaneando...' : 'Tomar foto') : 'Activar cámara'}
        </button>
      </div>

      {isCameraActive && <button type="button" onClick={stopCamera} className="mt-4 text-xs font-semibold text-slate-400 hover:text-slate-700">Detener cámara</button>}

      <canvas ref={canvasRef} className="hidden" />
    </section>
  );
}