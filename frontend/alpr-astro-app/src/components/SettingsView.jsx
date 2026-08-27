import React, { useEffect, useState } from 'react';
import { Check, Palette, SlidersHorizontal } from 'lucide-react';
import backgroundImage from './fondo.png';

const backgroundOptions = [
  { name: 'Niebla', color: '#f8fafc' },
  { name: 'Azul suave', color: '#eef5ff' },
  { name: 'Azul cielo', color: '#e7f3ff' },
  { name: 'Gris claro', color: '#eef1f4' },
  { name: 'Hexágonos', color: '#f8fbff', image: backgroundImage.src },
];

export default function SettingsView() {
  const [background, setBackground] = useState(backgroundOptions[0]);

  useEffect(() => {
    const savedBackground = window.localStorage.getItem('alpr-background');
    if (!savedBackground) return;

    try {
      const saved = JSON.parse(savedBackground);
      if (saved?.color) setBackground(saved);
    } catch {
      const legacyOption = backgroundOptions.find((option) => option.color === savedBackground);
      if (legacyOption) setBackground(legacyOption);
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--app-background', background.color);
    document.documentElement.style.setProperty('--app-background-image', background.image ? `url(${background.image})` : 'none');
    window.localStorage.setItem('alpr-background', JSON.stringify(background));
  }, [background]);

  return (
    <section className="settings-page" aria-labelledby="settings-title">
      <div className="settings-page-heading">
        <div className="settings-page-icon"><SlidersHorizontal size={22} /></div>
        <div>
          <p className="settings-eyebrow">CENTRO DE CONTROL</p>
          <h2 id="settings-title">Configuración</h2>
          <p>Personaliza tu espacio de trabajo y las preferencias del escáner.</p>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-heading">
          <div className="settings-section-icon"><Palette size={19} /></div>
          <div><h3>Apariencia</h3><p>Elige el tono que acompañará tus jornadas de escaneo.</p></div>
        </div>
        <div className="settings-options">
          {backgroundOptions.map((option) => (
            <button key={option.name} type="button" title={option.name} aria-label={`Usar fondo ${option.name}`} aria-pressed={background.name === option.name} onClick={() => setBackground(option)} className={`settings-swatch ${background.name === option.name ? 'selected' : ''}`} style={{ backgroundColor: option.color, backgroundImage: option.image ? `url(${option.image})` : 'none' }}>
              {background.name === option.name && <Check className="settings-check" size={18} />}
            </button>
          ))}
          <label className="settings-custom-swatch" title="Elegir color personalizado">
            <span>+</span>
            <input type="color" value={background.color} onChange={(event) => setBackground({ name: 'Personalizado', color: event.target.value })} aria-label="Elegir un color personalizado" />
          </label>
        </div>
        <div className="settings-saved"><span style={{ backgroundColor: background.color }} /> Cambios guardados automáticamente en este dispositivo</div>
      </div>
    </section>
  );
}
