import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { fmt } from '../utils/financeUtils';
import { Trash2, Plus } from 'lucide-react';

export default function Commitments() {
  const { state, addCommitment, deleteCommitment } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', amount: '', day: '' });

  const totalCommitments = state.commitments.reduce((s, c) => s + c.amount, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    addCommitment({
      id: 'c' + Date.now(),
      name: formData.name,
      amount: Number(formData.amount),
      day: Number(formData.day)
    });
    setIsModalOpen(false);
    setFormData({ name: '', amount: '', day: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="glass-card main-card">
        <h2 className="card-label">Total Compromisos Mes</h2>
        <div className="money-big" style={{ color: 'var(--red)' }}>{fmt(totalCommitments)}</div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: '8px' }}>
          Estos gastos fijos se descuentan automáticamente de tu presupuesto disponible.
        </p>
      </div>

      <div className="glass-card">
        <div className="card-header-row" style={{ marginBottom: '16px' }}>
          <h3 className="card-title">Tus Compromisos Fijos</h3>
          <button className="icon-btn-sm" onClick={() => setIsModalOpen(true)} style={{ fontSize: '1.2rem' }}>
            <Plus size={18} />
          </button>
        </div>

        {state.commitments.length === 0 ? (
          <p className="empty-state">No hay compromisos configurados.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {state.commitments.sort((a, b) => a.day - b.day).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontWeight: 600, display: 'block' }}>{c.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Día de cobro: {c.day}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--red)' }}>{fmt(c.amount)}</span>
                  <button onClick={() => deleteCommitment(c.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)} style={{ display: 'flex' }}>
          <div className="modal glass-card">
            <div className="modal-header">
              <span className="modal-title">Nuevo Compromiso Fijo</span>
              <button className="icon-btn-sm" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre (Ej: Arriendo, Internet)</label>
                <input 
                  type="text" className="input" required 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Monto</label>
                <input 
                  type="number" className="input" required min="0" placeholder="0"
                  value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Día de Cobro (1 al 31)</label>
                <input 
                  type="number" className="input" required min="1" max="31" placeholder="Ej: 15"
                  value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>Guardar Compromiso</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
