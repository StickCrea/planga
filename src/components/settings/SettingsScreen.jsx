import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CATEGORY_ICONS, formatColombianInput, parseColombianInput } from '../../utils/financeUtils';
import { isDemoMode } from '../../lib/supabase';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function SettingsScreen({ onSave }) {
  const { state, updateSettings, showToast } = useFinance();

  const [income, setIncome] = useState(() => formatColombianInput(state.income));
  const [cycleDay, setCycleDay] = useState(state.cycleDay);
  const [categoryBudgets, setCategoryBudgets] = useState(() => {
    const init = {};
    Object.entries(state.categoryBudgets || {}).forEach(([cat, val]) => {
      init[cat] = formatColombianInput(val);
    });
    return init;
  });
  const [confirmReset, setConfirmReset] = useState(false);

  const handleBudgetChange = (cat, value) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [cat]: formatColombianInput(value)
    }));
  };

  const handleResetData = () => {
    setConfirmReset(true);
  };

  const confirmResetData = () => {
    const keys = [
      'mock_db_profiles',
      'mock_db_ciclos',
      'mock_db_gastos',
      'mock_db_gasto_items',
      'mock_db_presupuestos',
      'mock_db_compromisos',
      'mock_db_ingresos_extra',
      'mock_db_activos',
      'mock_db_deudas',
      'planga_savings_goals'
    ];
    keys.forEach(k => localStorage.removeItem(k));
    setConfirmReset(false);
    showToast('Datos de prueba restablecidos correctamente', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const parsedBudgets = {};
    Object.entries(categoryBudgets).forEach(([cat, val]) => {
      parsedBudgets[cat] = parseColombianInput(val);
    });

    updateSettings({ 
      income: parseColombianInput(income), 
      cycleDay: Number(cycleDay),
      categoryBudgets: parsedBudgets
    });
    
    showToast('Configuración guardada correctamente');
    if (onSave) onSave();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
      <div className="glass-card">
        <h2 className="modal-title">Configuración</h2>
        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label>Ingreso Mensual Base</label>
            <input 
              type="text" 
              className="input" 
              placeholder="Ej. 1.200.000"
              value={income} 
              onChange={(e) => setIncome(formatColombianInput(e.target.value))} 
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '4px', lineHeight: '1.4' }}>
              Tu salario básico, honorarios fijos o el monto principal recurrente de dinero que recibes mensualmente. Es la base para calcular tu presupuesto disponible.
            </p>
          </div>
          
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Día de inicio del ciclo</label>
            <input 
              type="number" className="input" min="1" max="31"
              value={cycleDay} onChange={(e) => setCycleDay(e.target.value)} 
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '4px', lineHeight: '1.4' }}>
              El día de tu pago o quincena en el que se reinicia tu periodo presupuestal (ej: día 1, 15, o 30). Agrupa tus gastos e ingresos coherentes con esta fecha.
            </p>
          </div>

          <div className="settings-section" style={{ marginTop: '20px' }}>
            <h3 className="settings-subtitle">Presupuestos por Categoría</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '-8px', marginBottom: '14px', lineHeight: '1.4' }}>
              Distribuye límites de dinero recomendados para gastar en cada área durante el mes. Recibirás avisos si te acercas o excedes estos valores.
            </p>
            <div className="category-budgets-grid">
              {Object.keys(CATEGORY_ICONS).map(cat => (
                <div key={cat} className="budget-input-group">
                  <label htmlFor={`budget-${cat}`}>
                    {CATEGORY_ICONS[cat]} <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                  </label>
                  <input 
                    id={`budget-${cat}`}
                    type="text" 
                    className="input budget-setting-input" 
                    placeholder="0"
                    value={categoryBudgets[cat] || ''} 
                    onChange={(e) => handleBudgetChange(cat, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '24px', width: '100%' }}>
            Guardar Configuración
          </button>
        </form>
      </div>

      {isDemoMode && (
      <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <h3 className="settings-subtitle" style={{ color: 'var(--red)' }}>Datos de Prueba</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: '16px', lineHeight: '1.4' }}>
          Si los datos simulados locales están corruptos o deseas iniciar de cero con montos coherentes en pesos colombianos, puedes limpiar el almacenamiento simulado.
        </p>
        <button 
          onClick={handleResetData}
          className="btn-danger"
          style={{ 
            width: '100%', 
            padding: '10px 16px', 
            borderRadius: '12px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            color: 'var(--red)', 
            fontWeight: 700, 
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.25)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Restablecer Base de Datos Local
        </button>
      </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={confirmResetData}
        tone="danger"
        title="¿Restablecer datos locales?"
        message="¿Estás seguro de que deseas restablecer todos tus datos locales de prueba? Se borrarán tus gastos, ingresos, deudas y compromisos actuales."
        confirmLabel="Restablecer"
      />

      {/* Versión del build: al reportar un bug sabemos exactamente qué está
          corriendo el usuario. __APP_VERSION__ lo inyecta Vite desde package.json. */}
      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text3)', marginTop: 'var(--space-5)' }}>
        Finly v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'}
      </p>
    </div>
  );
}
