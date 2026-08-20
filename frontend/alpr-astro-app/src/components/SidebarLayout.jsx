import React, { useState } from 'react';
import { Camera, ClipboardList, Settings, Shield, Menu, X, Wifi } from 'lucide-react';

export default function SidebarLayout({ children, currentPath }) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Escaneo', path: '/', icon: Camera },
    { name: 'Historial', path: '/historial', icon: ClipboardList },
    { name: 'Configuración', path: '/configuracion', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <span className="font-black text-sm tracking-wider uppercase text-slate-900">
            ALPR 
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          aria-label="Toggle Menu">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

     
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden"/>
      )}

      
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 flex flex-col shadow-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
       
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-slate-100">
          <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-wider uppercase text-slate-900">
              ALPR
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
               Aplicacion web
            </p>
          </div>
        </div>

       
        <nav className="flex-1 p-4 space-y-1.5 mt-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>

     
        <div className="p-4 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Wifi className="w-4 h-4 text-slate-400" />
            <span>API: Localhost:8000</span>
          </div>
        </div>
      </aside>

   
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}