import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  getAvailableMoney, getDaysRemaining, getDailyBudget, 
  getTotalSpent, getStatus, getCurrentMonthExpenses, 
  getTotalCommitments, fmt, CATEGORY_ICONS 
} from '../utils/financeUtils';

export default function Dashboard({ onSelectExpense }) {
  const { state } = useFinance();

  const available = getAvailableMoney(state);
  const daysLeft = getDaysRemaining(state);
  const dailyBudget = getDailyBudget(state);
  const totalSpent = getTotalSpent(state);
  const status = getStatus(state);
  const expenses = getCurrentMonthExpenses(state);
  const commitmentsTotal = getTotalCommitments(state);
  
  const daysElapsed = new Date().getDate();
  const dailyAvg = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
  
  const spentPercent = state.income > 0 ? Math.min((totalSpent + commitmentsTotal) / state.income * 100, 100) : 0;
  
  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (spentPercent / 100) * circumference;
  const ringColor = spentPercent > 90 ? 'var(--red)' : spentPercent > 70 ? 'var(--yellow)' : 'var(--green)';

  const recentExpenses = [...expenses].reverse().slice(0, 4);

  return (
    <>
      <div className={`status-banner status-${status.level}`}>
        <span>{status.icon}</span>
        <span>{status.text}</span>
      </div>

      <div className={`glass-card main-card pulse-border-${status.level}`}>
        <h2 className="card-label">Dinero Disponible</h2>
        <div className="money-big">{fmt(available)}</div>
        
        <div className="card-row">
          <div className="card-stat">
            <span className="stat-label">Días</span>
            <span className="stat-value">{daysLeft}</span>
          </div>
          <div className="card-divider"></div>
          <div className="card-stat">
            <span className="stat-label">Hoy</span>
            <span className="stat-value stat-highlight" style={{ color: `var(--${status.level})` }}>
              {fmt(dailyBudget)}
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card progress-card">
        <div className="progress-ring-container">
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle className="progress-ring-bg" cx="55" cy="55" r="48" />
            <circle 
              className="progress-ring-fill" 
              cx="55" cy="55" r="48" 
              style={{ strokeDashoffset: offset, stroke: ringColor }}
            />
          </svg>
          <div className="progress-ring-text">
            <span className="ring-percent">{Math.round(spentPercent)}%</span>
            <span className="ring-label">Gastado</span>
          </div>
        </div>
        <div className="progress-stats">
          <div className="pstat">
            <span className="pstat-val">{fmt(totalSpent)}</span>
            <span className="pstat-label">Gastos del mes</span>
          </div>
          <div className="pstat">
            <span className="pstat-val">{fmt(dailyAvg)}</span>
            <span className="pstat-label">Promedio diario</span>
          </div>
          <div className="pstat">
            <span className="pstat-val">{fmt(commitmentsTotal)}</span>
            <span className="pstat-label">Compromisos</span>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="card-header-row">
          <h3 className="card-title">Últimos Gastos</h3>
        </div>
        <ul className="expense-list-mini">
          {recentExpenses.length === 0 ? (
            <li className="empty-state">Sin gastos recientes.</li>
          ) : (
            recentExpenses.map(e => {
              const icon = CATEGORY_ICONS[e.category] || '📦';
              const label = e.merchant || e.category;
              
              // Use invoice date and timestamp to show a better label
              const invoiceDate = new Date(e.date + 'T12:00:00');
              const isToday = invoiceDate.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
              const dateDisplay = isToday ? 'Hoy' : invoiceDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
              
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
