import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'accent', // 'accent' | 'danger'
}) {
  if (!open) return null;
  const toneColor = tone === 'danger' ? 'var(--red)' : 'var(--green)';
  const toneBg = tone === 'danger' ? 'rgba(255, 82, 82, 0.1)' : 'rgba(0, 230, 118, 0.1)';
  const Icon = tone === 'danger' ? AlertTriangle : CheckCircle2;

  return (
    <Modal open={open} onClose={onClose} maxWidth="380px">
      <div style={{ textAlign: 'center', padding: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: toneBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: toneColor }}>
            <Icon size={24} />
          </div>
        </div>
        <h3 className="modal-title" style={{ marginBottom: '10px', fontSize: '1.15rem' }}>{title}</h3>
        {message && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text2)', lineHeight: '1.5', marginBottom: '20px' }}>
            {message}
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '10px', fontSize: '0.85rem' }}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            style={{ padding: '10px', fontSize: '0.85rem', boxShadow: 'none' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
