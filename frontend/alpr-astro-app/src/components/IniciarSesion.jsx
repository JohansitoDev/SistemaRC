import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ScanLine,
  UserRound,
} from 'lucide-react';
import institutionImage from './image.png';
import backgroundImage from './fondo.png';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8001/api/plates';

export default function IniciarSesion() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [touched, setTouched] = useState({});

  const isRegistering = mode === 'register';

  const markTouched = (field) => setTouched((current) => ({ ...current, [field]: true }));
  const isEmpty = (field, value) => touched[field] && !value.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL.replace(/\/plates$/, '')}/${isRegistering ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRegistering
          ? { name, email, password, password_confirmation: passwordConfirmation }
          : { email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.detail || data.message || 'Error de autenticación');
        return;
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      sessionStorage.setItem('show_welcome', 'true');
      window.location.href = '/';
    } catch (error) {
      console.error('Error durante el inicio de sesión:', error);
      setErrorMessage('No se pudo conectar con el servidor.');
    }
  };

  return (
    <main className="auth-shell" style={{ '--auth-background': `url(${backgroundImage.src})` }}>
      <section className="auth-visual" aria-label="Escáner de matrículas">
        <div className="visual-grid" />
        <div className="visual-content">
          <div className="institution-logo-wrap">
            <img src={institutionImage.src} alt="Emblema" className="institution-logo" />
          </div>

          <div className="visual-proof">
            <span className="proof-icon"><Check size={15} /></span>
            <span>Control inteligente de matrículas</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="mobile-brand"><ScanLine size={19} /> PLACA ESCÁNER</div>
          <div className="auth-heading">
            <p className="eyebrow">BIENVENIDO DE NUEVO</p>
            <h2>{isRegistering ? 'Crea tu cuenta' : 'Inicia sesión'}</h2>
            <p>{isRegistering ? 'Configura tu acceso al centro de control.' : 'Accede a tu app inteligente de escaneo de placas .'}</p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Acceso">
            <button type="button" role="tab" aria-selected={!isRegistering} className={!isRegistering ? 'active' : ''} onClick={() => { setMode('login'); setErrorMessage(''); }}>
              Iniciar sesion
            </button>
            <button type="button" role="tab" aria-selected={isRegistering} className={isRegistering ? 'active' : ''} onClick={() => { setMode('register'); setErrorMessage(''); }}>
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} onInvalid={(event) => markTouched(event.target.id)} className="auth-form">
            {isRegistering && <label htmlFor="name">Nombre completo</label>}
            {isRegistering && <div className={`input-wrap ${isEmpty('name', name) ? 'input-invalid' : ''}`}>
              <UserRound size={18} />
              <input id="name" type="text" value={name} onBlur={() => markTouched('name')} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre completo" autoComplete="name" required />
            </div>}

            <label htmlFor="email">Correo electrónico</label>
            <div className={`input-wrap ${isEmpty('email', email) ? 'input-invalid' : ''}`}>
              <Mail size={18} />
              <input id="email" type="email" value={email} onBlur={() => markTouched('email')} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@ejemplo.com" autoComplete="email" required />
            </div>

            <label htmlFor="password">Contraseña</label>
            <div className={`input-wrap ${isEmpty('password', password) ? 'input-invalid' : ''}`}>
              <LockKeyhole size={18} />
              <input id="password" type={showPassword ? 'text' : 'password'} value={password} onBlur={() => markTouched('password')} onChange={(event) => setPassword(event.target.value)} placeholder="Introduce tu contraseña" autoComplete={isRegistering ? 'new-password' : 'current-password'} required />
              <button type="button" className="icon-button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {isRegistering && <>
              <label htmlFor="password-confirmation">Confirmar contraseña</label>
              <div className={`input-wrap ${isEmpty('password-confirmation', passwordConfirmation) ? 'input-invalid' : ''}`}>
                <LockKeyhole size={18} />
                <input id="password-confirmation" type={showPassword ? 'text' : 'password'} value={passwordConfirmation} onBlur={() => markTouched('password-confirmation')} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Repite tu contraseña" autoComplete="new-password" required />
              </div>
            </>}

            {!isRegistering && <div className="form-meta"><label className="remember"><input type="checkbox" /> <span>Recordarme</span></label><a href="/login#recuperar">¿Olvidaste tu contraseña?</a></div>}
            {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}

            <button type="submit" className="submit-button">
              <span>{isRegistering ? 'Crear mi cuenta' : 'Entrar al panel'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

      
        </div>
      </section>
    </main>
  );
}
