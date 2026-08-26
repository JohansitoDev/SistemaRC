import React, { useEffect, useState } from 'react';
import { Check, Palette, X } from 'lucide-react';

const backgroundOptions = [
  { name: 'Niebla', value: '#f8fafc' },
  { name: 'Azul suave', value: '#eef5ff' },
  { name: 'Menta', value: '#effaf5' },
  { name: 'Lavanda', value: '#f5f3ff' },
  { name: 'Arena', value: '#fffaf0' },
];

export function SettingsModal({ isOpen, onClose }) {
  const [background, setBackground] = useState(backgroundOptions[0].value);

  useEffect(() => {
    const savedBackground = window.localStorage.getItem('alpr-background');
    if (savedBackground) setBackground(savedBackground);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-background', background);
    window.localStorage.setItem('alpr-background', background);
  }, [background]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="max-h-[min(680px,calc(100vh-2rem))] w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-white/70">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-900 p-2.5 text-white"><Palette className="h-5 w-5" /></div>
            <div><h3 id="settings-title" className="text-lg font-bold text-slate-900">Configuración</h3><p className="text-xs text-slate-500">Preferencias del escáner</p></div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800" aria-label="Cerrar configuración"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid max-h-[calc(100vh-8rem)] overflow-y-auto md:grid-cols-[180px_1fr]">
          <nav className="border-b border-slate-100 bg-slate-50/70 p-4 md:border-b-0 md:border-r md:p-5">
            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Preferencias</p>
            <div className="rounded-xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white">Apariencia</div>
          </nav>

          <div className="p-5 md:p-8">
            <div className="mb-7"><h4 className="text-base font-bold text-slate-900">Color de fondo</h4><p className="mt-1 text-sm leading-6 text-slate-500">Elige el tono que acompañará tus jornadas de escaneo.</p></div>
            <div className="flex flex-wrap gap-3">
              {backgroundOptions.map((option) => (
                <button key={option.value} type="button" title={option.name} aria-label={`Usar fondo ${option.name}`} aria-pressed={background === option.value} onClick={() => setBackground(option.value)} className={`relative h-16 w-16 rounded-2xl border-2 transition-transform hover:scale-105 ${background === option.value ? 'border-blue-600 ring-4 ring-blue-100' : 'border-white ring-1 ring-slate-200'}`} style={{ backgroundColor: option.value }}>{background === option.value && <Check className="absolute inset-0 m-auto h-5 w-5 text-blue-600" />}</button>
              ))}
              <label className="relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white text-xl text-slate-400 hover:border-blue-400 hover:text-blue-500"><span aria-hidden="true">+</span><input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Elegir un color personalizado" /></label>
            </div>
            <div className="mt-10 flex items-center gap-3 border-t border-slate-100 pt-5 text-xs text-slate-500"><span className="h-3 w-3 rounded-full ring-2 ring-white ring-offset-1" style={{ backgroundColor: background }} /> Cambios guardados automáticamente en este dispositivo</div>
          </div>
        </div>
      </div>
    </div>
  );
}
