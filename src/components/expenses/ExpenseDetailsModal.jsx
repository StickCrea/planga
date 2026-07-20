import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CATEGORY_ICONS, fmt } from '../../utils/financeUtils';
import { ChevronDown, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';

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

  const handleDelete = () => {
    deleteExpense(expense.id);
    setConfirmDelete(false);
    onClose();
  };

  return (
    <>
      <Modal open onClose={onClose} title="Detalle del Gasto">
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
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        tone="danger"
        title="¿Eliminar este gasto?"
        message="Esta acción no se puede deshacer y se eliminará de todos los reportes."
        confirmLabel="Sí, Eliminar"
      />
    </>
  );
}
