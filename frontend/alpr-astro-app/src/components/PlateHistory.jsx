import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, CheckCircle, Clock, Filter, FileSpreadsheet, RefreshCcw } from 'lucide-react';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8001/api/plates';

const formatDate = (value) => {
  if (!value) return 'Fecha no disponible';

  const normalizedValue = String(value).replace(/\.(\d{3})\d+Z$/, '.$1Z');
  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function PlateHistory() {
  const [plates, setPlates] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  // Obtiene las placas guardadas a través de FastAPI.
  const fetchPlatesFromDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || data.error || data.message || `FastAPI respondió con HTTP ${response.status}`);
      }

      setPlates(Array.isArray(data) ? data : (data.data || []));
      setStatusMessage('');
    } catch (error) {
      console.error('Error cargando historial:', error);
      setStatusMessage(error.message || 'No se pudo cargar el historial.');
      const localData = JSON.parse(localStorage.getItem('offline_plates') || '[]');
      setPlates(localData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatesFromDatabase();
  }, []);

  // Filtrado combinado: Botones de estado + Buscador de texto
  const filteredPlates = plates.filter((plate) => {
    const matchesFilter =
      filter === 'STOLEN' ? plate.is_stolen :
      filter === 'SAVED' ? !plate.is_stolen : true;

    const matchesSearch =
      (plate.plate_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plate.message || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No se pudo cargar el historial: {statusMessage}. Mostrando registros locales.
        </div>
      )}
      {/* Controles: Buscador + Filtros + Botón de Actualizar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Buscador Dinámico */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por placa (Ej: OF00105)..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Botón para refrescar datos desde FastAPI */}
          <button
            onClick={fetchPlatesFromDatabase}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl shadow-sm transition-all flex items-center gap-2 text-xs font-bold"
            title="Sincronizar con FastAPI"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {/* Botones de Filtro */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Todas</span>
            </button>

            <button
              onClick={() => setFilter('STOLEN')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'STOLEN'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-rose-50 hover:text-rose-600'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Robadas</span>
            </button>

            <button
              onClick={() => setFilter('SAVED')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'SAVED'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Normales</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla con datos persistidos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="p-4">Matrícula</th>
                <th className="p-4">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm bg-white">
              {loading ? (
                <tr>
                  <td colSpan="2" className="p-12 text-center text-slate-400 font-medium">
                    Cargando registros desde la base de datos...
                  </td>
                </tr>
              ) : filteredPlates.length === 0 ? (
                <tr>
                  <td colSpan="2" className="p-12 text-center text-slate-400 font-medium bg-white">
                    <div className="flex flex-col items-center gap-2">
                      <FileSpreadsheet className="w-10 h-10 text-slate-300" />
                      <span className="text-slate-600 font-bold">No se encontraron registros</span>
                        <p className="text-xs text-slate-400">Verifica que el backend FastAPI esté respondiendo correctamente.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPlates.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-blue-50/40 transition-colors">
                    {/* Placa */}
                    <td className="p-4">
                      <span className="font-mono font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 tracking-wider text-base shadow-sm">
                        {item.plate_number}
                      </span>
                    </td>

                    {/* Fecha y Hora */}
                    <td className="p-4 text-slate-600 font-medium text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{formatDate(item.captured_at || item.created_at)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}