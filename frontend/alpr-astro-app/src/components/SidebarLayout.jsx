import React, { useState } from 'react';
import { Camera, ClipboardList, FileText, KeyRound, LogOut, Mail, Settings, Shield, Menu, UserCircle, X } from 'lucide-react';
import { SettingsModal } from './SettingsModal.jsx';

export default function SidebarLayout({ children, currentPath, initialSettingsOpen = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(initialSettingsOpen);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const menuItems = [
    { name: 'Escaneo', path: '/', icon: Camera },
    { name: 'Historial', path: '/historial', icon: ClipboardList },
    { name: 'Configuración', path: '/configuracion', icon: Settings, action: 'settings' },
  ];

  return (
    <div className="app-main-surface min-h-screen text-slate-800 flex flex-col md:flex-row">
      <header className="app-surface fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 px-4 shadow-sm md:px-6">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsOpen(!isOpen)} className="rounded-xl bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 md:hidden" aria-label="Abrir menú">
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-slate-900" />
            <span className="text-sm font-black uppercase tracking-wider text-slate-900">ALPR</span>
          </div>
        </div>

        <div className="relative">
          <button type="button" onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-900 text-xs font-black text-white shadow-sm ring-1 ring-slate-200 transition-transform hover:scale-105" aria-label="Abrir perfil" aria-expanded={isProfileOpen}>
            <UserCircle className="h-6 w-6" />
          </button>
          {isProfileOpen && (
            <div className="absolute right-0 top-12 w-64 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
              <div className="border-b border-slate-100 px-3 py-3">
                <p className="text-sm font-bold text-slate-900">Administrador</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Mail className="h-3.5 w-3.5" /> admin@escaner.local</p>
              </div>
              <button type="button" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"><UserCircle className="h-4 w-4" /> Editar perfil</button>
              <button type="button" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"><KeyRound className="h-4 w-4" /> Cambiar contraseña</button>
              <button type="button" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"><FileText className="h-4 w-4" /> Política de seguridad</button>
              <button type="button" className="mt-1 flex w-full items-center gap-2.5 rounded-xl border-t border-slate-100 px-3 py-2.5 pt-3 text-left text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" /> Cerrar sesión</button>
            </div>
          )}
        </div>
      </header>

     
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden"/>
      )}

      
      <aside
        className={`app-surface fixed top-16 left-0 z-40 flex h-[calc(100vh-4rem)] w-64 transform flex-col border-r border-slate-200 shadow-sm transition-transform duration-300 md:sticky md:top-16 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
       
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-slate-100">
          <div className="rounded-xl bg-slate-900 p-2 text-white">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-wider uppercase text-slate-900">
              Escaner
            </h1>
          </div>
        </div>

       
        <nav className="flex-1 p-4 space-y-1.5 mt-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon; // la vista de escaneo dedebe verse ccomo la chagpt con dos botones subir foto y activar camara cunado le de activar camara el recuadro aparece
            const isActive = currentPath === item.path;
            return (
              item.action === 'settings' ? <button
                key={item.path}
                type="button"
                onClick={() => { setIsOpen(false); setIsSettingsOpen(true); }}
                className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all ${
                  isSettingsOpen
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSettingsOpen ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                <span>{item.name}</span>
              </button> : <a
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>
      </aside>

   
      <main className="app-main-surface min-h-screen w-full max-w-7xl flex-1 p-4 pt-24 md:p-8 md:pt-24">
        {children}
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}