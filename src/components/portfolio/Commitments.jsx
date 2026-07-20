import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { fmt, formatColombianInput, parseColombianInput } from '../../utils/financeUtils';
import { Trash2, Plus, Edit2, Info } from 'lucide-react';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';

export default function Commitments() {
  const { state, addCommitment, updateCommitment, deleteCommitment, markCommitmentAsPaid, showToast } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', amount: '', day: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, commitment: null });

  const totalCommitments = state.commitments.reduce((s, c) => s + c.amount, 0);

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: '', amount: '', day: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingId(c.id);
    setFormData({ name: c.name, amount: formatColombianInput(c.amount), day: c.day || 1 });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseColombianInput(formData.amount);
    
    if (parsedAmount <= 0) {
      showToast('Por favor ingresa un monto válido', 'error');
      return;
    }

    if (editingId) {
      updateCommitment({
        id: editingId,
        name: formData.name,
        amount: parsedAmount,
        day: Number(formData.day)
      });
      showToast('Compromiso actualizado');
    } else {
      addCommitment({
        id: 'c' + Date.now(),
        name: formData.name,
        amount: parsedAmount,
        day: Number(formData.day)
      });
      showToast('Compromiso guardado');
    }
    setIsModalOpen(false);
    setFormData({ name: '', amount: '', day: '' });
    setEditingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="glass-card main-card">
        <h2 className="card-label">Total Compromisos Mes</h2>
        <div className="money-big" style={{ color: 'var(--red)' }}>{fmt(totalCommitments)}</div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: '8px', lineHeight: '1.4' }}>
          Estos gastos fijos no se descuentan por adelantado. Solo se restan de tu dinero disponible del ciclo actual cuando los marcas como pagados.
        </p>
      </div>

      {/* Cajita explicativa premium integrada */}
      <div className="glass-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent)', display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.01)' }}>
        <Info size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>¿Qué son los Compromisos Fijos?</h4>
          <p style={{ fontSize: '0.76rem', color: 'var(--text3)', lineHeight: '1.4' }}>
            Son aquellos gastos obligatorios fijos recurrentes (como el arriendo, el plan del celular o servicios). 
            A diferencia de las deudas, solo se descuentan de tu saldo disponible cuando confirmas su pago presionando "Pagar".
          </p>
        </div>
      </div>

      <div className="glass-card">
        <div className="card-header-row" style={{ marginBottom: '16px' }}>
          <h3 className="card-title">Tus Compromisos Fijos</h3>
          <button className="icon-btn-sm" onClick={openNewModal} style={{ fontSize: '1.2rem' }}>
            <Plus size={18} />
          </button>
        </div>

        {(() => {
          const currentMk = state.selectedMonth || state.currentCiclo?.nombre || '';
          const paidIds = state.paidCommitmentIds?.[currentMk] || [];
          
          if (state.commitments.length === 0) {
            return <EmptyState message="No hay compromisos configurados." />;
          }
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {state.commitments.sort((a, b) => a.day - b.day).map(c => {
                const isPaid = paidIds.includes(c.id);
                return (
                  <div 
                    key={c.id} 
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', 
                      background: isPaid ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.03)', 
                      border: isPaid ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--glass-border)', 
                      borderRadius: '10px',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, display: 'block', fontSize: '0.9rem', textDecoration: isPaid ? 'line-through' : 'none', opacity: isPaid ? 0.6 : 1 }}>
                        {c.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                        Día de cobro: {c.day} de cada ciclo {isPaid && '· ✅ Pagado'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, color: isPaid ? 'var(--green)' : 'var(--red)', fontSize: '0.9rem', textDecoration: isPaid ? 'line-through' : 'none', opacity: isPaid ? 0.6 : 1 }}>
                        {fmt(c.amount)}
                      </span>
                      
                      {!isPaid ? (
                        <button 
                          onClick={() => setConfirmModal({ isOpen: true, commitment: c })}
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            border: '1px solid var(--glass-border)', 
                            borderRadius: '16px', 
                            padding: '4px 10px', 
                            color: 'var(--text2)', 
                            fontSize: '0.72rem', 
                            cursor: 'pointer',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                        >
                          Pagar
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--green)', fontWeight: 800, padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
                          ✓ Pagado
                        </span>
                      )}

                      {!isPaid && (
                        <button onClick={() => openEditModal(c)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4 }} title="Editar">
                          <Edit2 size={16} />
                        </button>
                      )}
                      
                      <button onClick={() => deleteCommitment(c.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 4 }} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Compromiso' : 'Nuevo Compromiso Fijo'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del compromiso</label>
            <input
              type="text" className="input" required
              placeholder="Ej: Arriendo, Internet, Plan Móvil"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'block', marginTop: '4px' }}>El nombre para identificar este gasto obligatorio.</span>
          </div>
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>Monto a pagar (COP)</label>
            <input
              type="text" className="input" required placeholder="0"
              value={formData.amount} onChange={e => setFormData({...formData, amount: formatColombianInput(e.target.value)})}
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'block', marginTop: '4px' }}>El valor mensual recurrente en pesos colombianos.</span>
          </div>
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>Día de Cobro (1 al 31)</label>
            <input
              type="number" className="input" required min="1" max="31" placeholder="Ej: 15"
              value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})}
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text3)', display: 'block', marginTop: '4px' }}>El día de tu ciclo de pago en que se descuenta este cobro.</span>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '16px', width: '100%' }}>{editingId ? 'Actualizar Compromiso' : 'Guardar Compromiso'}</button>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, commitment: null })}
        onConfirm={() => {
          markCommitmentAsPaid(confirmModal.commitment);
          setConfirmModal({ isOpen: false, commitment: null });
        }}
        tone="accent"
        title="¿Marcar como pagado?"
        message={
          <>
            ¿Deseas marcar <strong>{confirmModal.commitment?.name}</strong> como pagado?
            Se registrará automáticamente como un gasto real de <strong style={{ color: 'var(--red)' }}>{fmt(confirmModal.commitment?.amount)}</strong> en este ciclo.
          </>
        }
        confirmLabel="Confirmar Pago"
      />
    </div>
  );
}
