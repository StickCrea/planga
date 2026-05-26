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
  // Calculate days elapsed since cycle start (not since month start)
  const today = new Date();
  const cycleStart = state.currentCiclo
    ? new Date(state.currentCiclo.fecha_inicio + 'T00:00:00')
    : today;
  const daysElapsed = Math.max(Math.ceil((today - cycleStart) / (1000 * 60 * 60 * 24)) + 1, 1);
  const dailyAvg = totalSpent / daysElapsed;
  
  const totalCommitments = state.commitments.reduce((s,c) => s + c.amount, 0);
  const idealSpent = (state.income - totalCommitments) / getDaysInMonth(state) * daysElapsed;
  const ratio = idealSpent > 0 ? Math.min(totalSpent / idealSpent * 100, 150) : 0;

  const mask = (val) => fmt(val);

  const catTotals = {};
  expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
  const maxCat = Math.max(...Object.values(catTotals), 1);

  return (
    <>
      <div className="glass-card">
        <h2 className="card-title">Resumen del Mes</h2>
        <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '-12px', marginBottom: '14px', lineHeight: '1.4' }}>
          Consumo total acumulado y tu promedio de gasto diario registrado durante el periodo actual.
        </p>
        <div className="summary-stats-row" style={{ marginTop: '16px', marginBottom: '16px' }}>
          <div className="summary-stat-card">
            <span className="summary-stat-label">Gasto Total</span>
            <span className="summary-stat-val">{mask(totalSpent)}</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text3)', marginTop: '2px', display: 'block' }}>Suma de consumos en el ciclo</span>
          </div>
          <div className="summary-stat-card">
            <span className="summary-stat-label">Promedio Diario</span>
            <span className="summary-stat-val">{mask(dailyAvg)}</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text3)', marginTop: '2px', display: 'block' }}>Gasto medio por día transcurrido</span>
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
          <p style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: '6px', lineHeight: '1.4' }}>
            El **Ritmo Ideal** representa el ritmo teórico de gasto diario uniforme para no terminar el ciclo de pago en déficit.
          </p>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="card-title">Por Categoría</h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '-12px', marginBottom: '14px', lineHeight: '1.4' }}>
          Distribución de tus gastos agrupados de mayor a menor consumo.
        </p>
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
                  <span className="cat-row-amount">{mask(total)}</span>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '16px' }}>
        <h3 className="card-title">Todos los Gastos del Mes</h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '-12px', marginBottom: '14px', lineHeight: '1.4' }}>
          Historial completo de consumos registrados durante este ciclo de pago, ordenado por fecha de manera descendente.
        </p>
        <ul className="expense-list-full">
          {expenses.length === 0 ? (
            <li className="empty-state">Sin gastos registrados.</li>
          ) : (
            [...expenses].reverse().map(e => {
              const icon = CATEGORY_ICONS[e.category] || '📦';
              const label = e.merchant || e.category;
              
              const invoiceDate = new Date(e.date + 'T12:00:00');
              const dateDisplay = invoiceDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
              const timeDisplay = e.timestamp && !isNaN(new Date(e.timestamp).getTime())
                ? new Date(e.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                : new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

              return (
                <li key={e.id} className="expense-item" style={{ cursor: 'pointer' }} onClick={() => onSelectExpense && onSelectExpense(e)}>
                  <div className="expense-icon">{icon}</div>
                  <div className="expense-info">
                    <span className="expense-cat">{label}</span>
                    <span className="expense-time">{dateDisplay} · {timeDisplay}</span>
                  </div>
                  <span className="expense-amount">-{mask(e.amount)}</span>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </>
  );
}
