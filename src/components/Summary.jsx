import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  getCurrentMonthExpenses, getTotalSpent, getDaysInMonth, 
  fmt, CATEGORY_ICONS, CATEGORY_COLORS 
} from '../utils/financeUtils';

export default function Summary({ onSelectExpense }) {
  const { state } = useFinance();
  const expenses = getCurrentMonthExpenses(state);
  const totalSpent = getTotalSpent(state);
  const daysElapsed = Math.max(new Date().getDate(), 1);
  const dailyAvg = totalSpent / daysElapsed;
  
  const totalCommitments = state.commitments.reduce((s,c) => s + c.amount, 0);
  const idealSpent = (state.income - totalCommitments) / getDaysInMonth(state) * daysElapsed;
  const ratio = idealSpent > 0 ? Math.min(totalSpent / idealSpent * 100, 150) : 0;

  const catTotals = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const maxCat = Math.max(...Object.values(catTotals), 1);

  return (
    <>
      <div className="glass-card">
        <h2 className="card-title">Resumen del Mes</h2>
        <div className="summary-stats-row" style={{ marginTop: '16px', marginBottom: '16px' }}>
          <div className="summary-stat-card">
            <span className="summary-stat-label">Gasto Total</span>
            <span className="summary-stat-val">{fmt(totalSpent)}</span>
          </div>
          <div className="summary-stat-card">
            <span className="summary-stat-label">Promedio Diario</span>
            <span className="summary-stat-val">{fmt(dailyAvg)}</span>
          </div>
        </div>

        <div className="budget-compare">
          <div className="budget-bar-label">
            <span>vs. Ritmo Ideal</span>
            <span>{Math.round(ratio)}%</span>
          </div>
          <div className="budget-bar-track">
            <div 
              className="budget-bar-fill" 
              style={{ 
                width: `${Math.min(ratio, 100)}%`, 
                background: ratio > 100 ? 'var(--red)' : ratio > 80 ? 'var(--yellow)' : 'var(--green)' 
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Por Categoría</h3>
        <div className="category-breakdown">
          {Object.keys(catTotals).length === 0 ? (
            <p className="empty-state">Sin datos todavía.</p>
          ) : (
            Object.entries(catTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, total]) => (
                <div key={cat} className="cat-row">
                  <div className="cat-row-icon">{CATEGORY_ICONS[cat] || '📦'}</div>
                  <div className="cat-row-info">
                    <span className="cat-row-name">{cat}</span>
                    <div className="cat-row-bar">
                      <div 
                        className="cat-row-bar-fill" 
                        style={{ 
                          width: `${total / maxCat * 100}%`, 
                          background: CATEGORY_COLORS[cat] || 'var(--accent)' 
                        }}
                      ></div>
                    </div>
                  </div>
                  <span className="cat-row-amount">{fmt(total)}</span>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '16px' }}>
        <h3 className="card-title" style={{ marginBottom: '16px' }}>Todos los Gastos del Mes</h3>
        <ul className="expense-list-full">
          {expenses.length === 0 ? (
            <li className="empty-state">Sin gastos registrados.</li>
          ) : (
            [...expenses].reverse().map(e => {
              const icon = CATEGORY_ICONS[e.category] || '📦';
              const label = e.merchant || e.category;
              
              const invoiceDate = new Date(e.date + 'T12:00:00');
              const dateDisplay = invoiceDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
              const timeDisplay = new Date(e.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

              return (
                <li key={e.id} className="expense-item" style={{ cursor: 'pointer' }} onClick={() => onSelectExpense && onSelectExpense(e)}>
                  <div className="expense-icon">{icon}</div>
                  <div className="expense-info">
                    <span className="expense-cat">{label}</span>
                    <span className="expense-time">{dateDisplay} · {timeDisplay}</span>
                  </div>
                  <span className="expense-amount">-{fmt(e.amount)}</span>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </>
  );
}
