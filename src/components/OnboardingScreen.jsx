import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { fmt, getCycleInfo } from '../utils/financeUtils';

const STEPS = ['Bienvenida', 'Ingresos', 'Ciclo', 'Compromisos'];

export default function OnboardingScreen({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [nombre, setNombre] = useState('');
  const [moneda, setMoneda] = useState('COP');
  const [income, setIncome] = useState('');
  const [cycleDay, setCycleDay] = useState('');
  const [commitments, setCommitments] = useState([]);

  const addCommitment = () => {
    setCommitments([...commitments, { id: 'c' + Date.now(), name: '', amount: '', day: '' }]);
  };

  const removeCommitment = (id) => {
    setCommitments(commitments.filter(c => c.id !== id));
  };

  const updateCommitment = (id, field, value) => {
    setCommitments(commitments.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleFinish = async () => {
    setSaving(true);
    setError('');
    try {
      const cd = parseInt(cycleDay) || 25;
      const inc = parseFloat(income) || 0;
      const totalFixed = commitments.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);

      // Save profile — this marks onboarding as done (ciclo_dia is set)
      await supabase.from('profiles').upsert({
        id: user.id,
        nombre: nombre.trim() || 'Usuario',
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
        ingreso: inc,
        gastos_fijos: totalFixed
      });

      // Save commitments to per-user localStorage key
      const validCommitments = commitments
        .filter(c => c.name && c.amount)
        .map(c => ({
          id: c.id,
          name: c.name,
          amount: parseFloat(c.amount),
          day: parseInt(c.day) || 1
        }));
      localStorage.setItem(`planga_commitments_${user.id}`, JSON.stringify(validCommitments));

      onComplete();
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Error guardando tu configuración: ' + (err.message || 'Intenta de nuevo.'));
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => step === 0 ? nombre.trim().length > 0 : true;

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
          <p style={{ color: 'var(--text3)', fontSize: '0.88rem' }}>Configuración inicial — solo se hace una vez</p>
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
          <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Paso {step + 1} de {STEPS.length} — {STEPS[step]}
          </p>

          {/* Step 0: Nombre y moneda */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>¡Bienvenido/a a Planga!</h2>
              <p style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>
                Esta información es completamente privada. Solo tú la verás. Cada usuario tiene su propia configuración.
              </p>
              <div className="form-group">
                <label>¿Cómo te llamas?</label>
                <input
                  type="text" className="input"
                  placeholder="Tu nombre o apodo"
                  value={nombre} onChange={e => setNombre(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>¿Con qué moneda trabajas?</label>
                <select className="input" value={moneda} onChange={e => setMoneda(e.target.value)}>
                  <option value="COP">COP — Peso Colombiano</option>
                  <option value="USD">USD — Dólar Americano</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="MXN">MXN — Peso Mexicano</option>
                  <option value="PEN">PEN — Sol Peruano</option>
                  <option value="ARS">ARS — Peso Argentino</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 1: Ingresos */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>¿Cuánto ganas al mes?</h2>
              <div style={{ padding: '10px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.8rem', color: 'var(--text2)' }}>
                💡 Ingresa tu salario neto (lo que recibes después de impuestos). Si tienes ingresos variables, puedes usar un promedio. Podrás modificarlo después.
              </div>
              <div className="amount-card">
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
                  ✅ {fmt(parseFloat(income))} / mes
                </div>
              )}
            </div>
          )}

          {/* Step 2: Día de ciclo */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>¿Cuándo te pagan?</h2>
              <div style={{ padding: '10px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.8rem', color: 'var(--text2)' }}>
                💡 El <strong>día de ciclo</strong> es el día del mes en que recibes tu ingreso (quincena, nomina). Por ejemplo: si te pagan el día 25, escribe 25. Planga organizará tus gastos a partir de ese día cada mes.
              </div>
              <div className="form-group">
                <label>Día del mes (1 al 31)</label>
                <input
                  type="number" className="input"
                  min="1" max="31"
                  placeholder="Ej: 25"
                  value={cycleDay} onChange={e => setCycleDay(e.target.value)}
                  autoFocus
                />
              </div>
              {cycleDay && parseInt(cycleDay) >= 1 && parseInt(cycleDay) <= 31 && (
                <div style={{ padding: '10px', background: 'rgba(34,197,94,0.08)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.2)', fontSize: '0.8rem', color: 'var(--text2)' }}>
                  📅 Tu ciclo va del <strong>día {cycleDay}</strong> de cada mes al <strong>día {parseInt(cycleDay) - 1}</strong> del siguiente mes.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Compromisos */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Gastos fijos mensuales</h2>
              <div style={{ padding: '10px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.8rem', color: 'var(--text2)' }}>
                💡 Son los pagos que haces sí o sí cada mes: arriendo, internet, cuota del gym, etc. Planga los descuenta automáticamente de tu presupuesto disponible. Puedes saltarte este paso y agregarlos después en la pestaña "Compromisos".
              </div>

              {commitments.length === 0 && (
                <p style={{ color: 'var(--text3)', fontSize: '0.82rem', textAlign: 'center', padding: '8px 0' }}>
                  No has agregado compromisos aún. Puedes agregarlos ahora o después.
                </p>
              )}

              {commitments.map((c, idx) => (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    {idx === 0 && <label style={{ fontSize: '0.72rem' }}>Nombre</label>}
                    <input
                      type="text" className="input" placeholder="Ej: Arriendo"
                      value={c.name} onChange={e => updateCommitment(c.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    {idx === 0 && <label style={{ fontSize: '0.72rem' }}>Monto</label>}
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
                + Agregar compromiso fijo
              </button>

              {commitments.filter(c => c.amount).length > 0 && (
                <div style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 700, fontSize: '0.85rem' }}>
                  Total fijos: {fmt(commitments.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', color: '#ef4444', fontSize: '0.8rem' }}>
              {error}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            {step > 0 && (
              <button
                type="button" onClick={() => setStep(step - 1)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}
              >← Atrás</button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="btn-primary"
                style={{ flex: 2 }}
                disabled={!canNext()}
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="btn-primary"
                style={{ flex: 2 }}
                disabled={saving}
              >
                {saving ? 'Guardando...' : '¡Comenzar con Planga! 🚀'}
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text3)', marginTop: '16px' }}>
          Toda tu información es privada y encriptada. Solo tú tienes acceso.
        </p>
      </div>
    </div>
  );
}
