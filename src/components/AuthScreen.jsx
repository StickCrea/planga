import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthScreen() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { nombre } }
      });
      if (error) {
        setError(error.message);
      } else if (data.user && !data.session) {
        setMessage('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.');
      }
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px' }}>
            Planga<span style={{ color: 'var(--green)' }}>.</span>
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: '0.9rem', marginTop: '6px' }}>
            Controla cada peso de tu vida financiera
          </p>
        </div>

        <div className="glass-card">
          {/* Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg3)', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                background: mode === 'login' ? 'var(--bg2)' : 'transparent',
                color: mode === 'login' ? 'var(--text)' : 'var(--text3)'
              }}
            >Iniciar Sesión</button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                background: mode === 'register' ? 'var(--bg2)' : 'transparent',
                color: mode === 'register' ? 'var(--text)' : 'var(--text3)'
              }}
            >Registrarse</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'register' && (
              <div className="form-group">
                <label>Tu nombre</label>
                <input
                  type="text" className="input" required placeholder="Ej: Stiven"
                  value={nombre} onChange={e => setNombre(e.target.value)}
                />
              </div>
            )}
            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email" className="input" required placeholder="tu@correo.com"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password" className="input" required placeholder="Mínimo 6 caracteres"
                minLength={6}
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', color: '#ef4444', fontSize: '0.82rem', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ padding: '10px', background: 'rgba(34,197,94,0.1)', borderRadius: '8px', color: 'var(--green)', fontSize: '0.82rem', border: '1px solid rgba(34,197,94,0.3)' }}>
                {message}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading && <Loader2 size={18} className="ocr-spinner" />}
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>o continúa con</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background 0.2s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text3)', marginTop: '20px' }}>
          Tus datos financieros están protegidos y son privados.
        </p>
      </div>
    </div>
  );
}
