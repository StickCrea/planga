import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CATEGORY_ICONS, fmt } from '../utils/financeUtils';
import { ChevronDown, Trash2 } from 'lucide-react';

export default function ExpenseDetailsModal({ expense, onClose }) {
  const { deleteExpense } = useFinance();
  const [showMeta, setShowMeta] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!expense) return null;

  const icon = CATEGORY_ICONS[expense.category] || '📦';
  const merchantName = expense.merchant || expense.category.charAt(0).toUpperCase() + expense.category.slice(1);
  
  // Format dates exactly as legacy did
  const d = new Date(expense.date + 'T12:00:00'); // Use invoice date primarily
  const dateStr = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDelete = () => {
    deleteExpense(expense.id);
    onClose();
  };

  return (
    <div className="modal-overlay active" onClick={handleOverlayClick} style={{ display: 'flex' }}>
      <div className="modal glass-card">
        {confirmDelete ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <h3 style={{ marginBottom: '16px' }}>¿Eliminar este gasto?</h3>
            <p style={{ color: 'var(--text2)', marginBottom: '24px', fontSize: '0.9rem' }}>
              Esta acción no se puede deshacer y se eliminará de todos los reportes.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancelar</button>
              <button className="btn-danger" onClick={handleDelete}>Sí, Eliminar</button>
            </div>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <span className="modal-title">Detalle del Gasto</span>
              <button className="icon-btn-sm" onClick={onClose}>✕</button>
            </div>
            
            <div className="details-content">
              <div className="details-main">
                <div className="details-icon">{icon}</div>
                <div>
                  <div className="details-merchant">{merchantName}</div>
                  <div className="details-date">{dateStr}</div>
                </div>
              </div>
              
              {expense.paymentMethod && (
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '16px'
                }}>
                  {expense.paymentMethod === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                  {expense.paymentMethod === 'tarjeta' && expense.paymentEntity && ` · ${expense.paymentEntity} (${expense.paymentType === 'debito' ? 'Débito' : 'Crédito'})`}
                </div>
              )}

              {expense.items && expense.items.length > 0 && (
                <>
                  <div className="details-divider"></div>
                  <h4 className="details-subtitle">Productos Detectados</h4>
                  <ul className="details-items-list">
                    {expense.items.map((item, i) => (
                      <li key={i} className="details-item">
                        <span>• {item.desc}</span>
                        <span className="details-item-price">{fmt(item.price)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {expense.metadata && expense.metadata.length > 0 && (
                <div className="details-meta-container">
                  <button className={`details-meta-toggle ${showMeta ? 'active' : ''}`} onClick={() => setShowMeta(!showMeta)}>
                    <span>Ver datos técnicos (OCR)</span>
                    <ChevronDown size={16} />
                  </button>
                  {showMeta && (
                    <div className="details-meta-content">
                      <ul className="details-meta-list">
                        {expense.metadata.map((m, i) => (
                          <li key={i} className="details-meta-item">
                            <span>{m.label}</span>
                            <span className="details-meta-val">{m.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="details-footer">
                <button 
                  className="icon-btn-sm" 
                  style={{ color: 'var(--text3)' }} 
                  title="Eliminar gasto"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={18} />
                </button>
                <span>Total</span>
                <span className="details-total">{fmt(expense.amount)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
