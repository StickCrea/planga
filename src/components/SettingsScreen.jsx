import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CATEGORY_ICONS } from '../utils/financeUtils';

export default function SettingsScreen({ onSave }) {
  const { state, updateSettings } = useFinance();
  
  const [income, setIncome] = useState(state.income);
  const [cycleDay, setCycleDay] = useState(state.cycleDay);
  const [categoryBudgets, setCategoryBudgets] = useState(state.categoryBudgets);

  const handleBudgetChange = (cat, value) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [cat]: Number(value)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings({ 
      income: Number(income), 
      cycleDay: Number(cycleDay),
      categoryBudgets
    });
    if (onSave) onSave();
  };

  return (
    <div className="glass-card" style={{ marginTop: '24px' }}>
      <h2 className="modal-title">Configuración</h2>
      <form onSubmit={handleSubmit}>
        
        <div className="form-group">
          <label>Ingreso Mensual Base</label>
          <input 
            type="number" className="input" 
            value={income} onChange={(e) => setIncome(e.target.value)} 
          />
        </div>
        
        <div className="form-group">
          <label>Día de inicio del ciclo</label>
          <input 
            type="number" className="input" min="1" max="31"
            value={cycleDay} onChange={(e) => setCycleDay(e.target.value)} 
          />
        </div>

        <div className="settings-section">
          <h3 className="settings-subtitle">Presupuestos por Categoría</h3>
          <div className="category-budgets-grid">
            {Object.keys(CATEGORY_ICONS).map(cat => (
              <div key={cat} className="budget-input-group">
                <label htmlFor={`budget-${cat}`}>
                  {CATEGORY_ICONS[cat]} <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                </label>
                <input 
                  id={`budget-${cat}`}
                  type="number" 
                  className="input budget-setting-input" 
                  value={categoryBudgets[cat] || 0} 
                  onChange={(e) => handleBudgetChange(cat, e.target.value)}
                  min="0" 
                />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '24px' }}>
          Guardar Configuración
        </button>
      </form>
    </div>
  );
}
