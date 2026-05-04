import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { fmt } from '../utils/financeUtils';
import { getCycleInfo } from '../utils/financeUtils';

const STEPS = ['Bienvenida', 'Ingresos', 'Ciclo', 'Compromisos'];

export default function OnboardingScreen({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState(user?.user_metadata?.nombre || '');
  const [moneda, setMoneda] = useState('COP');
  const [income, setIncome] = useState('');
  const [cycleDay, setCycleDay] = useState('25');
  const [commitments, setCommitments] = useState([
    { id: 'c1', name: 'Arriendo', amount: '', day: 1 }
  ]);

  const addCommitment = () => {
    setCommitments([...commitments, { id: 'c' + Date.now(), name: '', amount: '', day: 1 }]);
  };

  const removeCommitment = (id) => {
    setCommitments(commitments.filter(c => c.id !== id));
  };

  const updateCommitment = (id, field, value) => {
    setCommitments(commitments.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const cd = parseInt(cycleDay) || 25;
      const inc = parseFloat(income) || 0;
      const totalFixed = commitments.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);

      // Save profile
      await supabase.from('profiles').upsert({
        id: user.id,
        nombre: nombre || 'Usuario',
        moneda,
        ciclo_dia: cd,
        frecuencia: 'mensual'
      });

      // Create first ciclo
      const cycleInfo = getCycleInfo(new Date(), cd);
      await supabase.from('ciclos').upsert({
        user_id: user.id,
        nombre: cycleInfo.monthKey,
        fecha_inicio: cycleInfo.startDate.toISOString().slice(0, 10),
        fecha_fin: cycleInfo.endDate.toISOString().slice(0, 10),
        ingresos: inc,
        gastos_fijos: totalFixed
      });

      // Save commitments to localStorage
      const validCommitments = commitments
        .filter(c => c.name && c.amount)
        .map(c => ({ ...c, amount: parseFloat(c.amount) }));
      localStorage.setItem('planga_commitments', JSON.stringify(validCommitments));

      onComplete();
    } catch (err) {
      console.error('Onboarding error:', err);
      alert('Error guardando tu configuración. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return nombre.trim().length > 0;
    if (step === 1) return parseFloat(income) > 0;
    if (step === 2) return parseInt(cycleDay) >= 1 && parseInt(cycleDay) <= 31;
    return true;
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
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '4px' }}>
            Planga<span style={{ color: 'var(--green)' }}>.</span>
          </h1>
          {step === 0 && <p style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>Vamos a configurar tu perfil financiero</p>}
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: i <= step ? 'var(--green)' : 'var(--bg3)',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        <div className="glass-card">
          <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Paso {step + 1} de {STEPS.length} — {STEPS[step]}
          </p>

          {/* Step 0: Bienvenida + nombre */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>¡Hola! ¿Cómo te llamas?</h2>
              <p style={{ color: 'var(--text2)', fontSize: '0.87rem' }}>
                Cada usuario tiene su propia información. Vamos a personalizar tu experiencia financiera.
              </p>
              <div className="form-group">
                <label>Tu nombre</label>
                <input
                  type="text" className="input" placeholder="Ej: Stiven"
                  value={nombre} onChange={e => setNombre(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Moneda</label>
                <select className="input" value={moneda} onChange={e => setMoneda(e.target.value)}>
                  <option value="COP">COP — Peso Colombiano</option>
                  <option value="USD">USD — Dólar Americano</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="MXN">MXN — Peso Mexicano</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 1: Ingresos */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>¿Cuánto ganas al mes?</h2>
              <p style={{ color: 'var(--text2)', fontSize: '0.87rem' }}>
                Este es tu ingreso base mensual. Podrás modificarlo cuando quieras desde Configuración.
              </p>
              <div className="amount-card" style={{ marginTop: '8px' }}>
                <label className="amount-label">Ingreso mensual</label>
                <div className="amount-input-wrap">
                  <span className="currency-prefix">$</span>
                  <input
                    type="number" className="amount-input"
                    placeholder="0" value={income}
                    onChange={e => setIncome(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              {income && parseFloat(income) > 0 && (
                <div style={{ textAlign: 'center', color: 'var(--green)', fontWeight: 700, fontSize: '0.9rem' }}>
                  ✅ {fmt(parseFloat(income))} por mes
                </div>
              )}
            </div>
          )}

          {/* Step 2: Día de ciclo */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>¿Cuándo te pagan?</h2>
              <p style={{ color: 'var(--text2)', fontSize: '0.87rem' }}>
                El día de tu ciclo es cuando recibes tu ingreso. La app calculará tu presupuesto a partir de ese día cada mes.
              </p>
              <div className="form-group">
                <label>Día del mes (1 al 31)</label>
                <input
                  type="number" className="input"
                  min="1" max="31" placeholder="Ej: 25 (día 25 de cada mes)"
                  value={cycleDay} onChange={e => setCycleDay(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ padding: '12px', background: 'rgba(34,197,94,0.08)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                  📅 Tu ciclo va del <strong>día {cycleDay || '?'}</strong> de un mes al <strong>día {cycleDay ? parseInt(cycleDay) - 1 : '?'}</strong> del siguiente.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Compromisos */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Gastos fijos mensuales</h2>
              <p style={{ color: 'var(--text2)', fontSize: '0.87rem' }}>
                Agrega tus compromisos fijos (arriendo, internet, etc.). Se descuentan automáticamente de tu presupuesto. Puedes modificarlos después.
              </p>

              {commitments.map((c, idx) => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    {idx === 0 && <label>Nombre</label>}
                    <input
                      type="text" className="input" placeholder="Ej: Arriendo"
                      value={c.name} onChange={e => updateCommitment(c.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    {idx === 0 && <label>Monto</label>}
                    <input
                      type="number" className="input" placeholder="0"
                      value={c.amount} onChange={e => updateCommitment(c.id, 'amount', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCommitment(c.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1.2rem', paddingBottom: '8px' }}
                  >✕</button>
                </div>
              ))}

              <button
                type="button" onClick={addCommitment}
                style={{ background: 'none', border: '1px dashed var(--glass-border)', borderRadius: '8px', color: 'var(--accent)', padding: '10px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                + Agregar otro compromiso
              </button>

              {commitments.filter(c => c.amount).length > 0 && (
                <div style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 700 }}>
                  Total fijos: {fmt(commitments.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0))}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            {step > 0 && (
              <button
                type="button" onClick={() => setStep(step - 1)}
                className="btn-secondary" style={{ flex: 1 }}
              >← Atrás</button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="btn-primary"
                style={{ flex: 2 }}
                disabled={!canNext()}
              >Siguiente →</button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="btn-primary"
                style={{ flex: 2 }}
                disabled={saving}
              >
                {saving ? 'Guardando...' : '¡Comenzar a usar Planga! 🚀'}
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text3)', marginTop: '16px' }}>
          Toda esta información es privada y solo visible para ti.
        </p>
      </div>
    </div>
  );
}
