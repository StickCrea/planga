import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import Logo from '../ui/Logo';

export default function ResetPasswordScreen() {
  const { completePasswordRecovery, cancelPasswordRecovery } = useFinance();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await completePasswordRecovery(password);
    setLoading(false);
    if (updateError) setError(updateError.message);
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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Logo size={46} />
          <p style={{ color: 'var(--text3)', fontSize: '0.9rem', marginTop: '6px' }}>
            Elige una nueva contraseña
          </p>
        </div>

        <div className="glass-card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="new-password">Nueva contraseña</label>
              <input
                id="new-password" name="new-password" autoComplete="new-password"
                type="password" className="input" required placeholder="Mínimo 6 caracteres"
                minLength={6}
                value={password} onChange={e => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirmar contraseña</label>
              <input
                id="confirm-password" name="confirm-password" autoComplete="new-password"
                type="password" className="input" required placeholder="Repite la contraseña"
                minLength={6}
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', color: '#ef4444', fontSize: '0.82rem', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading && <Loader2 size={18} className="ocr-spinner" />}
              Guardar nueva contraseña
            </button>
            <button
              type="button"
              onClick={cancelPasswordRecovery}
              style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Cancelar y volver a iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
