import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { fmt } from '../utils/financeUtils';
import { Trash2 } from 'lucide-react';

export default function Portfolio() {
  const { state, addAsset, deleteAsset, addDebt, deleteDebt } = useFinance();
  
  const [modalType, setModalType] = useState(null); // 'savings', 'investments', 'debts'
  const [formData, setFormData] = useState({ name: '', amount: '', paid: '' });

  const totalSavings = state.savings.reduce((s, a) => s + a.amount, 0);
  const totalInvestments = state.investments.reduce((s, a) => s + a.amount, 0);
  const totalAssets = totalSavings + totalInvestments;
  
  const totalDebtRemaining = state.debts.reduce((s, d) => s + (d.total - d.paid), 0);
  const netWorth = totalAssets - totalDebtRemaining;

  const handleOpenModal = (type) => {
    setModalType(type);
    setFormData({ name: '', amount: '', paid: '' });
  };

  const handleCloseModal = () => {
    setModalType(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalType === 'debts') {
      addDebt({
        id: 'd' + Date.now(),
        name: formData.name,
        total: Number(formData.amount),
        paid: Number(formData.paid || 0)
      });
    } else {
      addAsset(modalType, {
        id: 'a' + Date.now(),
        name: formData.name,
        amount: Number(formData.amount)
      });
    }
    handleCloseModal();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="glass-card main-card">
        <h2 className="card-label">Patrimonio Neto</h2>
        <div className="money-big">{fmt(netWorth)}</div>
        <div className="card-row">
          <div className="card-stat">
            <span className="stat-label">Activos</span>
            <span className="stat-value" style={{ color: 'var(--green)' }}>{fmt(totalAssets)}</span>
          </div>
          <div className="card-divider"></div>
          <div className="card-stat">
            <span className="stat-label">Pasivos</span>
            <span className="stat-value" style={{ color: 'var(--red)' }}>{fmt(totalDebtRemaining)}</span>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="card-header-row">
          <h3 className="card-title">Ahorros</h3>
          <button className="icon-btn-sm" onClick={() => handleOpenModal('savings')} style={{ fontSize: '1.2rem' }}>+</button>
        </div>
        {state.savings.length === 0 ? (
          <p className="empty-state">No tienes ahorros registrados.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {state.savings.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{fmt(s.amount)}</span>
                  <button onClick={() => deleteAsset('savings', s.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card">
        <div className="card-header-row">
          <h3 className="card-title">Inversiones</h3>
          <button className="icon-btn-sm" onClick={() => handleOpenModal('investments')} style={{ fontSize: '1.2rem' }}>+</button>
        </div>
        {state.investments.length === 0 ? (
          <p className="empty-state">No tienes inversiones registradas.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {state.investments.map(i => (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600 }}>{i.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>{fmt(i.amount)}</span>
                  <button onClick={() => deleteAsset('investments', i.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card">
        <div className="card-header-row">
          <h3 className="card-title">Deudas</h3>
          <button className="icon-btn-sm" onClick={() => handleOpenModal('debts')} style={{ fontSize: '1.2rem' }}>+</button>
        </div>
        {state.debts.length === 0 ? (
          <p className="empty-state">No tienes deudas registradas.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {state.debts.map(d => {
              const progress = d.total > 0 ? Math.min((d.paid / d.total) * 100, 100) : 0;
              return (
                <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontWeight: 600, display: 'block' }}>{d.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Pagado: {fmt(d.paid)} / {fmt(d.total)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: 'var(--red)', fontWeight: '700' }}>{fmt(d.total - d.paid)}</span>
                      <button onClick={() => deleteDebt(d.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
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

      {modalType && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && handleCloseModal()} style={{ display: 'flex' }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <span className="modal-title">
                {modalType === 'savings' ? 'Nuevo Ahorro' : modalType === 'investments' ? 'Nueva Inversión' : 'Nueva Deuda'}
              </span>
              <button className="icon-btn-sm" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre</label>
                <input 
                  type="text" className="input" required 
                  placeholder={modalType === 'debts' ? 'Ej: Préstamo Banco' : 'Ej: Acciones Apple'}
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>{modalType === 'debts' ? 'Monto Total' : 'Monto Actual'}</label>
                <input 
                  type="number" className="input" required min="0" placeholder="0"
                  value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              {modalType === 'debts' && (
                <div className="form-group">
                  <label>Monto Ya Pagado</label>
                  <input 
                    type="number" className="input" required min="0" max={formData.amount} placeholder="0"
                    value={formData.paid} onChange={e => setFormData({...formData, paid: e.target.value})}
                  />
                </div>
              )}
              <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
