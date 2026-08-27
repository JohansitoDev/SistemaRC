import React, { useState, useEffect } from 'react';
import { Car, ShieldAlert, CheckCircle } from 'lucide-react';

export default function PlateStats() {
  const [stats, setStats] = useState({ total: 0, stolen: 0, normal: 0 });

  useEffect(() => {
    fetch(`${import.meta.env.PUBLIC_API_URL || 'http://localhost:8001/api/plates'}/stats`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setStats(data);
        }
      })
      .catch((err) => console.error('Error al cargar estadísticas:', err));
  }, []);

  return (
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
  );
}