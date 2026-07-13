import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, maxWidth }) {
  if (!open) return null;
  return (
    <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && onClose?.()} style={{ display: 'flex' }}>
      <div className="modal glass-card" style={maxWidth ? { maxWidth } : undefined}>
        {title && (
          <div className="modal-header">
            <span className="modal-title">{title}</span>
            <button className="icon-btn-sm" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
