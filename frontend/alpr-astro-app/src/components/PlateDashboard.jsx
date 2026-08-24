import React, { useState, useEffect } from 'react';
import { Car, ShieldAlert, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000/api/plates';

export default function PlateDashboard() {
  const [plateInput, setPlateInput] = useState('');
  const [history, setHistory] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor de estado de red (Online / Offline)
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Estadísticas calculadas en tiempo real desde el historial
  const stats = {
    total: history.length,
    stolen: history.filter(item => item.is_stolen === true || item.is_stolen === 1).length,
    normal: history.filter(item => !(item.is_stolen === true || item.is_stolen === 1)).length,
  };

  // Envío a la API de Laravel
  const handleScanPlate = async (e) => {
    e.preventDefault();
    if (!plateInput.trim()) return;

    setLoading(true);
    setCurrentAlert(null);

    const formattedPlate = plateInput.toUpperCase().trim();
    const payload = {
      plate_number: formattedPlate,
      captured_at: new Date().toISOString(),
    };

    // Modo Offline
    if (!isOnline) {
      const offlineEntry = {
        ...payload,
        status: 'OFFLINE',
        captured_at: new Date().toLocaleString(),
        is_stolen: false,
      };
      setHistory((prev) => [offlineEntry, ...prev]);
      const stored = JSON.parse(localStorage.getItem('offline_plates') || '[]');
      localStorage.setItem('offline_plates', JSON.stringify([payload, ...stored]));
      setPlateInput('');
      setLoading(false);
      return;
    }

    // Modo Online
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      const newRecord = {
        plate_number: data.plate?.plate_number || data.plate_number || formattedPlate,
        captured_at: data.plate?.captured_at || data.captured_at || new Date().toLocaleString(),
        status: data.plate?.status || data.status,
        is_stolen: data.plate?.is_stolen ?? data.is_stolen,
        message: data.plate?.message || data.message,
      };

      if (newRecord.is_stolen) {
        setCurrentAlert(newRecord);
      }

      setHistory((prev) => [newRecord, ...prev]);
      setPlateInput('');
    } catch (error) {
      console.error('Error conectando a Laravel:', error);
      alert('No se pudo conectar con el backend de Laravel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 font-sans text-slate-800">
      {/* Navbar / Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Placa Escáner
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Reconocimiento de Placas en Tiempo Real
          </p>
        </div>

        {/* Badge Online/Offline */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all ${
            isOnline ? 'bg-emerald-600 shadow-sm' : 'bg-rose-600 shadow-sm animate-pulse'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-white animate-ping"></span>
          {isOnline ? 'Escaneo de matrículas' : 'Modo Offline (IndexedDB)'}
        </div>
      </header>

      {/* Tarjetas de Estadísticas integradas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Car className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Registros</p>
            <h3 className="text-2xl font-black text-slate-900">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Vehículos Robados</p>
            <h3 className="text-2xl font-black text-rose-600">{stats.stolen}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Vehículos Normales</p>
            <h3 className="text-2xl font-black text-emerald-600">{stats.normal}</h3>
          </div>
        </div>
      </div>

      {/* Banner de Alerta Crítica (Vehículo Robado) */}
      {currentAlert && (
        <div className="bg-rose-600 text-white p-4 md:p-5 rounded-xl flex items-center gap-4 mb-6 shadow-lg shadow-rose-600/30 border-2 border-rose-500 animate-bounce">
          <div className="text-4xl">🚨</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="bg-white text-rose-700 text-xs font-extrabold uppercase px-2 py-0.5 rounded">
                Alerta Crítica
              </span>
              <span className="text-xs text-rose-100 font-mono">
                {currentAlert.captured_at}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-wide mt-1">
              ¡VEHÍCULO CON REPORTE DE ROBO DETECTADO!
            </h2>
            <p className="text-sm font-semibold text-rose-100 mt-0.5">
              Matrícula:{' '}
              <span className="bg-black/40 text-yellow-300 font-mono px-2 py-0.5 rounded tracking-widest text-base">
                {currentAlert.plate_number}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Entrada y Escáner (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>📷</span> Entrada de Matrícula
            </h2>

            <form onSubmit={handleScanPlate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Número de Placa
                </label>
                <input
                  type="text"
                  value={plateInput}
                  onChange={(e) => setPlateInput(e.target.value)}
                  placeholder="EJ: A123456"
                  maxLength={10}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono font-bold text-xl uppercase tracking-wider transition-all outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-blue-600/20 transition-all flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Procesando...</span>
                  </>
                ) : (
                  <span>Registrar Captura</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Historial Reciente (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📋</span> Historial de Capturas
              </h2>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {history.length} Lecturas
              </span>
            </div>

            {history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-xl my-2">
                <span className="text-3xl mb-2">🚘</span>
                <p className="text-sm font-medium text-slate-500">
                  Esperando primeras capturas de placas...
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-l-4 flex items-center justify-between transition-all ${
                      item.is_stolen
                        ? 'bg-rose-50 border-rose-600 border-t border-r border-b border-rose-200'
                        : item.status === 'DUPLICATE'
                        ? 'bg-amber-50 border-amber-500 border-t border-r border-b border-amber-200'
                        : 'bg-slate-50 border-emerald-500 border-t border-r border-b border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-lg text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                          {item.plate_number}
                        </span>

                        {item.is_stolen && (
                          <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                            Robada
                          </span>
                        )}

                        {item.status === 'DUPLICATE' && (
                          <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                            Duplicada
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <span>🕒</span> {item.captured_at}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                          item.is_stolen
                            ? 'text-rose-700 bg-rose-100'
                            : item.status === 'DUPLICATE'
                            ? 'text-amber-800 bg-amber-100'
                            : 'text-emerald-700 bg-emerald-100'
                        }`}
                      >
                        {item.status || 'SAVED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}