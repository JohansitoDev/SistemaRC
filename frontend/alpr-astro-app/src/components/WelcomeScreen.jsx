import React, { useEffect, useState } from 'react';
import { ArrowRight, Camera, CheckCircle2, ScanLine, ShieldCheck } from 'lucide-react';

export default function WelcomeScreen({ children }) {
  const [user, setUser] = useState(null);
  const [shouldShow, setShouldShow] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const pendingWelcome = window.sessionStorage.getItem('show_welcome') === 'true';
    const savedUser = window.localStorage.getItem('auth_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setShouldShow(pendingWelcome);
  }, []);

  const handleContinue = () => {
    setVisible(false);
    window.sessionStorage.removeItem('show_welcome');
  };

  if (!shouldShow || !visible) return children;

  return (
    <section className="welcome-screen" aria-labelledby="welcome-title">
      <div className="" />
      <div className="" />
      <div className="welcome-icon"><ScanLine size={32} /></div>
      <p className="welcome-kicker">ACCESO CONFIRMADO</p>
      <h1 id="welcome-title">Bienvenido, <span>{user?.name || 'usuario'}</span></h1><br />
      <button type="button" className="welcome-button" onClick={handleContinue}>
        <Camera size={18} />
        <span>Comenzar a usar el sistema</span>
        <ArrowRight size={18} />
      </button>
    </section>
  );
}
