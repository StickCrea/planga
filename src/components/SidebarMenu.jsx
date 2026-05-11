import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { User, Mail, Phone, Settings, LogOut, BarChart2, Globe, ListChecks, ChevronRight, Edit2, Check, X, Database, BookOpen } from 'lucide-react';

export default function SidebarMenu({ isOpen, onClose, onNavigate }) {
  const { user, signOut, updateUserProfile } = useFinance();
  const [isEditing, setIsEditing] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');

  useEffect(() => {
    if (user?.user_metadata) {
      setNombre(user.user_metadata.nombre || '');
      setTelefono(user.user_metadata.telefono || '');
    }
  }, [user, isEditing]);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    await updateUserProfile({ nombre, telefono });
    setIsEditing(false);
  };

  const handleNav = (screen) => {
    onNavigate(screen);
    onClose();
  };

  const userInitial = (user?.user_metadata?.nombre || user?.email || '?').charAt(0).toUpperCase();

  return (
    <>
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(3px)',
          zIndex: 999, animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      />
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: '80%', maxWidth: '340px',
          background: 'var(--bg)', borderRight: '1px solid var(--glass-border)',
          zIndex: 1000, display: 'flex', flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
          animation: 'slideInLeft 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {/* Profile Header */}
        <div style={{ 
          padding: '40px 24px 24px', 
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)', 
          borderBottom: '1px solid var(--glass-border)', 
          position: 'relative' 
        }}>
          <button 
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div className="premium-avatar">
              {userInitial}
            </div>
            {!isEditing ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.user_metadata?.nombre || 'Usuario'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={12} style={{ flexShrink: 0 }} /> 
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</span>
                </p>
                {user?.user_metadata?.telefono && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={12} style={{ flexShrink: 0 }} /> 
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.user_metadata?.telefono}</span>
                  </p>
                )}
              </div>
            ) : null}
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '6px', color: 'var(--text)', cursor: 'pointer' }}
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>

          {isEditing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.2s ease-out' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem' }}>Apodo / Nombre</label>
                <input 
                  type="text" className="input" style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                  value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Stiven"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem' }}>Teléfono</label>
                <input 
                  type="tel" className="input" style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                  value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Ej: 300 123 4567"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '8px' }}>
                  Cancelar
                </button>
                <button type="button" className="btn-primary" onClick={handleSaveProfile} style={{ flex: 1, padding: '8px', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                  <Check size={16} /> Guardar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', marginLeft: '8px' }}>
            Navegación
          </p>

          <button className="menu-item-btn" onClick={() => handleNav('analytics')}>
            <BarChart2 size={20} className="menu-icon" />
            <span>Análisis</span>
            <ChevronRight size={16} className="menu-chevron" />
          </button>
          
          <button className="menu-item-btn" onClick={() => handleNav('reports')}>
            <Globe size={20} className="menu-icon" />
            <span>Global</span>
            <ChevronRight size={16} className="menu-chevron" />
          </button>
          
          <button className="menu-item-btn" onClick={() => handleNav('commitments')}>
            <ListChecks size={20} className="menu-icon" />
            <span>Compromisos Fijos</span>
            <ChevronRight size={16} className="menu-chevron" />
          </button>

          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '16px 8px' }} />
          
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', marginLeft: '8px' }}>
            Preferencias
          </p>

          <button className="menu-item-btn" onClick={() => handleNav('help')}>
            <BookOpen size={20} className="menu-icon" />
            <span>Guía de Usuario</span>
            <ChevronRight size={16} className="menu-chevron" />
          </button>

          <button className="menu-item-btn" onClick={() => handleNav('settings')}>
            <Settings size={20} className="menu-icon" />
            <span>Configuración</span>
            <ChevronRight size={16} className="menu-chevron" />
          </button>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '24px 16px 100px', /* Extra space for floating bottom nav */
          borderTop: '1px solid var(--glass-border)',
          background: 'var(--bg)'
        }}>
          <button 
            onClick={() => { onClose(); signOut(); }}
            style={{
              width: '100%', padding: '12px', borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}
