import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { fmt, formatColombianInput, parseColombianInput } from '../utils/financeUtils';
import { Trash2, Target, Calendar, Plus, Trophy } from 'lucide-react';
import Modal from './ui/Modal';
import ConfirmDialog from './ui/ConfirmDialog';
import EmptyState from './ui/EmptyState';

export default function Portfolio() {
  const { state, addAsset, deleteAsset, addDebt, deleteDebt, updateAssetValue, updateDebtPayment, showToast } = useFinance();

  const [modalType, setModalType] = useState(null); // 'savings', 'investments', 'debts', 'goals'
  const [formData, setFormData] = useState({ name: '', amount: '', paid: '', deadline: '' });
  const [depositTarget, setDepositTarget] = useState(null); // { type, item }
  const [depositAmount, setDepositAmount] = useState('');
  const [deleteGoalId, setDeleteGoalId] = useState(null);

  const [savingsGoals, setSavingsGoals] = useState(() => {
    const data = localStorage.getItem('planga_savings_goals');
    return data ? JSON.parse(data) : [
      { id: 'g1', name: 'Viaje a Medellín', target: 2000000, current: 850000, deadline: '2026-12-31' },
      { id: 'g2', name: 'Fondo de Emergencia', target: 5000000, current: 2500000, deadline: '2027-06-30' }
    ];
  });

  const saveGoals = (newGoals) => {
    setSavingsGoals(newGoals);
    localStorage.setItem('planga_savings_goals', JSON.stringify(newGoals));
  };

  const totalSavings = state.savings.reduce((s, a) => s + a.amount, 0);
  const totalInvestments = state.investments.reduce((s, a) => s + a.amount, 0);
  const totalAssets = totalSavings + totalInvestments;
  
  const totalDebtRemaining = state.debts.reduce((s, d) => s + (d.total - d.paid), 0);
  const netWorth = totalAssets - totalDebtRemaining;

  const mask = (val) => fmt(val);

  const handleOpenModal = (type) => {
    setModalType(type);
    setFormData({ name: '', amount: '', paid: '', deadline: '' });
  };

  const handleCloseModal = () => {
    setModalType(null);
  };

  const calculateDaysLeft = (dateStr) => {
    const diff = new Date(dateStr + 'T12:00:00') - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} días restantes` : 'Plazo cumplido';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalType === 'debts') {
      const parsedTotal = parseColombianInput(formData.amount);
      const parsedPaid = parseColombianInput(formData.paid || '0');
      
      if (parsedPaid > parsedTotal) {
        showToast('El monto pagado no puede ser mayor que el monto total', 'error');
        return;
      }

      addDebt({
        id: 'd' + Date.now(),
        name: formData.name,
        total: parsedTotal,
        paid: parsedPaid
      });
      showToast('Deuda guardada correctamente');
    } else if (modalType === 'goals') {
      const parsedTarget = parseColombianInput(formData.amount);
      const parsedCurrent = parseColombianInput(formData.paid || '0');

      if (parsedCurrent > parsedTarget) {
        showToast('El monto ahorrado no puede ser mayor que el objetivo', 'error');
        return;
      }

      const newGoal = {
        id: 'g' + Date.now(),
        name: formData.name,
        target: parsedTarget,
        current: parsedCurrent,
        deadline: formData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      };

      const newGoals = [...savingsGoals, newGoal];
      saveGoals(newGoals);
      showToast('Meta de ahorro agregada');
    } else {
      addAsset(modalType, {
        id: 'a' + Date.now(),
        name: formData.name,
        amount: parseColombianInput(formData.amount)
      });
      showToast('Activo guardado correctamente');
    }
    handleCloseModal();
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    const amountVal = parseColombianInput(depositAmount);
    if (amountVal <= 0) {
      showToast('Por favor ingresa un monto válido', 'error');
      return;
    }

    const { type, item } = depositTarget;
    if (type === 'savings' || type === 'investments') {
      const newValue = (item.amount || 0) + amountVal;
      updateAssetValue(type, item.id, newValue);
    } else if (type === 'goals') {
      const newValue = (item.current || 0) + amountVal;
      if (newValue > item.target) {
        showToast('El monto no puede superar el objetivo de la meta', 'error');
        return;
      }
      const newGoals = savingsGoals.map(g => g.id === item.id ? { ...g, current: newValue } : g);
      saveGoals(newGoals);
      showToast('Aporte registrado correctamente');
    } else if (type === 'debts') {
      const newValue = (item.paid || 0) + amountVal;
      if (newValue > item.total) {
        showToast('El abono no puede superar el saldo pendiente de la deuda', 'error');
        return;
      }
      updateDebtPayment(item.id, newValue);
    }

    setDepositTarget(null);
    setDepositAmount('');
  };

  const handleDeleteGoal = (id) => {
    const newGoals = savingsGoals.filter(g => g.id !== id);
    saveGoals(newGoals);
    showToast('Meta de ahorro eliminada');
  };

  const confirmDeleteGoal = () => {
    handleDeleteGoal(deleteGoalId);
    setDeleteGoalId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="glass-card main-card">
        <h2 className="card-label">Patrimonio Neto</h2>
        <div className="money-big">{mask(netWorth)}</div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '-8px', marginBottom: '14px', textAlign: 'center', lineHeight: '1.4' }}>
          La diferencia real entre todo lo que posees (Ahorros + Inversiones) y tus deudas totales acumuladas.
        </p>
        <div className="card-row">
          <div className="card-stat">
            <span className="stat-label">Activos</span>
            <span className="stat-value" style={{ color: 'var(--green)' }}>{mask(totalAssets)}</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text3)', marginTop: '2px' }}>Tus ahorros e inversiones sumados</span>
          </div>
          <div className="card-divider"></div>
          <div className="card-stat">
            <span className="stat-label">Pasivos</span>
            <span className="stat-value" style={{ color: 'var(--red)' }}>{mask(totalDebtRemaining)}</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text3)', marginTop: '2px' }}>Tus deudas totales pendientes</span>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="card-header-row" style={{ marginBottom: '4px' }}>
          <h3 className="card-title">Ahorros</h3>
          <button className="icon-btn-sm" onClick={() => handleOpenModal('savings')} style={{ fontSize: '1.2rem' }}>+</button>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '0px', marginBottom: '12px', lineHeight: '1.4' }}>
          Dinero guardado con alta disponibilidad o liquidez (ej. cuentas de ahorros, efectivo) para emergencias o corto plazo.
        </p>
        {state.savings.length === 0 ? (
          <EmptyState message="No tienes ahorros registrados." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {state.savings.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{mask(s.amount)}</span>
                  <button 
                    onClick={() => { setDepositTarget({ type: 'savings', item: s }); setDepositAmount(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    title="Ingresar más dinero"
                  >
                    <Plus size={16} />
                  </button>
                  <button onClick={() => deleteAsset('savings', s.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card">
        <div className="card-header-row" style={{ marginBottom: '4px' }}>
          <h3 className="card-title">Inversiones</h3>
          <button className="icon-btn-sm" onClick={() => handleOpenModal('investments')} style={{ fontSize: '1.2rem' }}>+</button>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '0px', marginBottom: '12px', lineHeight: '1.4' }}>
          Capital invertido en instrumentos que generan rentabilidad a mediano o largo plazo (ej. CDT, fondos, acciones, criptomonedas).
        </p>
        {state.investments.length === 0 ? (
          <EmptyState message="No tienes inversiones registradas." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {state.investments.map(i => (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
                <span style={{ fontWeight: 600 }}>{i.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{mask(i.amount)}</span>
                  <button 
                    onClick={() => { setDepositTarget({ type: 'investments', item: i }); setDepositAmount(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                    title="Ingresar más dinero"
                  >
                    <Plus size={16} />
                  </button>
                  <button onClick={() => deleteAsset('investments', i.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* METAS DE AHORRO WIDGET */}
      <div className="glass-card">
        <div className="card-header-row" style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} style={{ color: 'var(--accent)' }} />
            <h3 className="card-title">Metas de Ahorro</h3>
          </div>
          <button className="icon-btn-sm" onClick={() => handleOpenModal('goals')} style={{ fontSize: '1.2rem' }}>+</button>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '0px', marginBottom: '12px', lineHeight: '1.4' }}>
          Objetivos financieros específicos con un monto objetivo y fecha límite. Te ayudan a proyectar tus sueños de manera organizada.
        </p>
        {savingsGoals.length === 0 ? (
          <EmptyState message="No tienes metas de ahorro registradas." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            {savingsGoals.map(g => {
              const pct = g.target > 0 ? Math.min((g.current / g.target) * 100, 100) : 0;
              return (
                <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{g.name}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text3)', marginTop: '2px' }}>
                        Ahorrado: {mask(g.current)} / {mask(g.target)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent)' }}>{Math.round(pct)}%</span>
                      <button 
                        onClick={() => { setDepositTarget({ type: 'goals', item: g }); setDepositAmount(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                        title="Depositar dinero"
                      >
                        <Plus size={16} />
                      </button>
                      <button onClick={() => setDeleteGoalId(g.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Progressive Bar */}
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                      borderRadius: '4px',
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}></div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text3)', marginTop: '2px' }}>
                    <Calendar size={12} style={{ color: 'var(--text3)' }} />
                    <span>{calculateDaysLeft(g.deadline)} ({g.deadline})</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass-card">
        <div className="card-header-row" style={{ marginBottom: '4px' }}>
          <h3 className="card-title">Deudas</h3>
          <button className="icon-btn-sm" onClick={() => handleOpenModal('debts')} style={{ fontSize: '1.2rem' }}>+</button>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '0px', marginBottom: '12px', lineHeight: '1.4' }}>
          Obligaciones financieras o saldos a deber. Al restarse de tus activos, reflejan tu patrimonio neto verdadero.
        </p>
        {state.debts.filter(d => d.paid < d.total).length === 0 ? (
          <EmptyState message="No tienes deudas activas pendientes." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {state.debts.filter(d => d.paid < d.total).map(d => {
              const progress = d.total > 0 ? Math.min((d.paid / d.total) * 100, 100) : 0;
              return (
                <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontWeight: 600, display: 'block' }}>{d.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Pagado: {mask(d.paid)} / {mask(d.total)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--red)', fontWeight: '700' }}>{mask(d.total - d.paid)}</span>
                      <button 
                        onClick={() => { setDepositTarget({ type: 'debts', item: d }); setDepositAmount(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                        title="Abonar a la deuda"
                      >
                        <Plus size={16} />
                      </button>
                      <button onClick={() => deleteDebt(d.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg3)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--green)', borderRadius: '2px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LOGROS DE DEUDAS COMPLETADAS */}
      {state.debts.filter(d => d.paid >= d.total).length > 0 && (
        <div className="glass-card" style={{ border: '1px solid rgba(16, 185, 129, 0.25)', background: 'rgba(16, 185, 129, 0.02)' }}>
          <div className="card-header-row" style={{ marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} style={{ color: 'var(--green)' }} />
              <h3 className="card-title" style={{ color: 'var(--green)' }}>Logros: Deudas Pagadas</h3>
            </div>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '0px', marginBottom: '12px', lineHeight: '1.4' }}>
            ¡Felicitaciones! Aquí se almacenan tus grandes logros. Deudas que has liquidado por completo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {state.debts.filter(d => d.paid >= d.total).map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={15} style={{ color: 'var(--green)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--text2)' }}>{d.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 800 }}>{mask(d.total)} Pagado</span>
                  <button onClick={() => deleteDebt(d.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }} title="Eliminar logro">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={!!modalType}
        onClose={handleCloseModal}
        title={modalType === 'savings' ? 'Nuevo Ahorro' : modalType === 'investments' ? 'Nueva Inversión' : modalType === 'goals' ? 'Nueva Meta de Ahorro' : 'Nueva Deuda'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text" className="input" required
              placeholder={modalType === 'debts' ? 'Ej: Préstamo Banco' : modalType === 'goals' ? 'Ej: Viaje a Medellín' : modalType === 'savings' ? 'Ej: Cuenta de Ahorros Principal' : 'Ej: CDT Bancolombia'}
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'block', marginTop: '4px' }}>
              {modalType === 'savings' && 'Nombre para identificar tu cuenta o alcancía física.'}
              {modalType === 'investments' && 'Nombre del fondo, CDT o activo invertido.'}
              {modalType === 'goals' && 'El propósito u objetivo de esta meta de ahorro.'}
              {modalType === 'debts' && 'Nombre de la entidad bancaria o persona acreedora.'}
            </span>
          </div>
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>{modalType === 'debts' ? 'Monto Total' : modalType === 'goals' ? 'Objetivo de Ahorro' : 'Monto Actual'}</label>
            <input
              type="text"
              className="input" required placeholder="0"
              value={formData.amount} onChange={e => setFormData({...formData, amount: formatColombianInput(e.target.value)})}
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'block', marginTop: '4px' }}>
              {modalType === 'savings' && 'Saldo disponible guardado actualmente en pesos colombianos.'}
              {modalType === 'investments' && 'Valoración total actual de tu portafolio invertido.'}
              {modalType === 'goals' && 'Monto total que necesitas reunir para cumplir la meta.'}
              {modalType === 'debts' && 'El monto total inicial de la deuda.'}
            </span>
          </div>
          {(modalType === 'debts' || modalType === 'goals') && (
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>{modalType === 'debts' ? 'Monto Ya Pagado' : 'Monto Ya Ahorrado'}</label>
              <input
                type="text"
                className="input" required placeholder="0"
                value={formData.paid} onChange={e => setFormData({...formData, paid: formatColombianInput(e.target.value)})}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'block', marginTop: '4px' }}>
                {modalType === 'debts' && 'Monto que ya has pagado o abonado de esta obligación.'}
                {modalType === 'goals' && 'Dinero inicial con el que ya arrancas esta meta (opcional).'}
              </span>
            </div>
          )}
          {modalType === 'goals' && (
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Fecha Límite</label>
              <input
                type="date" className="input" required
                value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})}
                min={new Date().toISOString().slice(0, 10)}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'block', marginTop: '4px' }}>
                La fecha sugerida para completar el objetivo.
              </span>
            </div>
          )}
          <button type="submit" className="btn-primary" style={{ marginTop: '20px', width: '100%' }}>Guardar</button>
        </form>
      </Modal>

      <Modal
        open={!!depositTarget}
        onClose={() => setDepositTarget(null)}
        title={depositTarget && (
          (depositTarget.type === 'savings' && `Añadir Dinero a Ahorro: ${depositTarget.item.name}`) ||
          (depositTarget.type === 'investments' && `Añadir Dinero a Inversión: ${depositTarget.item.name}`) ||
          (depositTarget.type === 'goals' && `Aportar a la Meta: ${depositTarget.item.name}`) ||
          (depositTarget.type === 'debts' && `Registrar Abono a: ${depositTarget.item.name}`)
        )}
      >
        {depositTarget && (
          <form onSubmit={handleDepositSubmit}>
            <div className="form-group">
              <label>
                {depositTarget.type === 'debts' ? 'Monto del Abono (COP)' : 'Monto a Agregar (COP)'}
              </label>
              <input
                type="text"
                className="input" required placeholder="0" autoFocus
                value={depositAmount} onChange={e => setDepositAmount(formatColombianInput(e.target.value))}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'block', marginTop: '4px' }}>
                {depositTarget.type === 'savings' && 'Ingresa la cantidad que vas a sumar a este fondo de ahorro.'}
                {depositTarget.type === 'investments' && 'Ingresa la cantidad que vas a añadir a esta inversión.'}
                {depositTarget.type === 'goals' && `¿Cuánto dinero vas a aportar hoy para tu meta? (Faltante para cumplir: ${mask(depositTarget.item.target - depositTarget.item.current)})`}
                {depositTarget.type === 'debts' && `Registra el pago realizado. Reducirá el saldo de tu deuda en vivo (Pendiente: ${mask(depositTarget.item.total - depositTarget.item.paid)}).`}
              </span>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '20px', width: '100%' }}>
              {depositTarget.type === 'debts' ? 'Registrar Pago / Abono' : 'Depositar / Sumar Fondos'}
            </button>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteGoalId}
        onClose={() => setDeleteGoalId(null)}
        onConfirm={confirmDeleteGoal}
        tone="danger"
        title="¿Eliminar meta de ahorro?"
        message="¿Seguro que deseas eliminar esta meta de ahorro?"
        confirmLabel="Eliminar"
      />
    </div>
  );
}
